import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { QueueStatus } from "../../enum/queue.enum"

type Body = {
  sessionId?: string
  userProp?: {
    university?: string
    interests?: string[]
  }
}

function json(data: QueueStatus, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

type SupabaseConfig = { url: string; key: string } | { error: string }

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!url) return { error: "Missing env NEXT_PUBLIC_SUPABASE_URL" }
  if (!key) {
    return {
      error:
        "Missing Supabase key env. Set SUPABASE_SERVICE_ROLE_KEY (preferred for API routes)",
    }
  }

  return { url, key }
}

export async function POST(req: Request) {
  try {
    const cfg = getSupabaseConfig()
    if ("error" in cfg) return json({ error: cfg.error }, { status: 500 })

    const supabase = createClient(cfg.url, cfg.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const body = (await req.json()) as Body

    const sessionId = body?.sessionId
    const universityId = body?.userProp?.university
    const interestIds = body?.userProp?.interests ?? []

    // ========================
    // BASIC VALIDATION
    // ========================
    if (!sessionId) return json({ error: "Missing sessionId" }, { status: 400 })
    if (!isUuid(sessionId)) return json({ error: "sessionId must be a UUID" }, { status: 400 })
    if (!universityId) return json({ error: "Missing userProp.university" }, { status: 400 })
    if (!Array.isArray(interestIds) || interestIds.length === 0) {
      return json({ error: "userProp.interests must be a non-empty array" }, { status: 400 })
    }

    // ========================
    // VALIDATION FOR EXISTING MATCH
    // ========================
    const { data: existingRoom, error: existingRoomError } = await supabase
      .from("match_rooms")
      .select("room_id, session_1_id, session_2_id")
      .or(`session_1_id.eq.${sessionId},session_2_id.eq.${sessionId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingRoomError) {
      return json({ error: existingRoomError.message }, { status: 500 })
    }

    if (existingRoom) {
      const alreadyMatchedId =
        existingRoom.session_1_id === sessionId
          ? existingRoom.session_2_id
          : existingRoom.session_1_id

      return json({
        status: "matched",
        roomId: existingRoom.room_id,
        matchedSessionId: alreadyMatchedId,
      })
    }

    // ========================
    // UPSERT SESSION PROFILE
    // ========================
    const { error: sessionError } = await supabase
      .from("match_sessions")
      .upsert(
        {
          session_id: sessionId,
          university_id: universityId,
          interest_ids: interestIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" },
      )

    if (sessionError) return json({ error: sessionError.message }, { status: 500 })

    // ========================
    // JOIN QUEUE
    // ========================
    const { error: queueError } = await supabase
      .from("match_queue")
      .upsert(
        { session_id: sessionId, university_id: universityId, interest_ids: interestIds },
        { onConflict: "session_id" },
      )

    if (queueError) return json({ error: queueError.message }, { status: 500 })

    // ========================
    //  QUEUE POLLING LOOP (POLL FOR MATCH)
    // ========================
    const { data: candidates, error: candidatesError } = await supabase
      .from("match_queue")
      .select("session_id, university_id, joined_at")
      .neq("session_id", sessionId)
      .overlaps("interest_ids", interestIds)
      .order("joined_at", { ascending: true })

    if (candidatesError) return json({ error: candidatesError.message }, { status: 500 })

    if (!candidates || candidates.length === 0) {
      return json({ status: "waiting"})
    }

    const sameUniversity = candidates.filter((c) => c.university_id === universityId)
    const best = sameUniversity.length > 0 ? sameUniversity[0] : candidates[0]
    const matchedSessionId: string = best.session_id

    if (!isUuid(matchedSessionId)) {
      return json({ error: "Matched sessionId is not a UUID (bad data in match_queue)" }, { status: 500 })
    }

    // ========================
    // STEP 6: REMOVE BOTH FROM MATCH_QUEUE
    // ========================
    const { error: deleteQueueError } = await supabase
      .from("match_queue")
      .delete({ count: "exact" })
      .in("session_id", [sessionId, matchedSessionId])

    if (deleteQueueError) return json({ error: deleteQueueError.message }, { status: 500 })


    // ========================
    // STEP 7: CREATE ROOM
    // ========================
    const session1 = sessionId < matchedSessionId ? sessionId : matchedSessionId
    const session2 = sessionId < matchedSessionId ? matchedSessionId : sessionId

    const { data: room, error: roomError } = await supabase
      .from("match_rooms")
      .insert({ session_1_id: session1, session_2_id: session2 })
      .select("room_id")
      .single()

    if (roomError || !room) {
      return json({ error: roomError?.message ?? "Failed to create room" }, { status: 500 })
    }

    // ========================
    // STEP 8: RETURN MATCH RESULT
    // ========================
    return json({
      status: "matched",
      roomId: room.room_id,
      matchedSessionId: matchedSessionId,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return json({ error: message }, { status: 500 })
  }
}

type DeleteBody = {
  roomId?: string
}

export async function DELETE(req: Request) {
  try {
    const cfg = getSupabaseConfig()
    if ("error" in cfg) return json({ error: cfg.error }, { status: 500 })

    const supabase = createClient(cfg.url, cfg.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const body = (await req.json().catch(() => ({}))) as DeleteBody
    const roomId = body?.roomId

    if (!roomId) return json({ error: "Missing roomId" }, { status: 400 })
    if (!isUuid(roomId)) return json({ error: "roomId must be a UUID" }, { status: 400 })

    // Lookup sessions for cleanup
    const { data: room, error: roomLookupError } = await supabase
      .from("match_rooms")
      .select("session_1_id, session_2_id")
      .eq("room_id", roomId)
      .maybeSingle()

    if (roomLookupError) return json({ error: roomLookupError.message }, { status: 500 })

    // Delete the room first (FK -> match_sessions)
    const { error: deleteRoomError } = await supabase
      .from("match_rooms")
      .delete()
      .eq("room_id", roomId)

    if (deleteRoomError) return json({ error: deleteRoomError.message }, { status: 500 })

    if (room?.session_1_id && room?.session_2_id) {
      const sessionIds = [String(room.session_1_id), String(room.session_2_id)]

      // Best-effort cleanup: ignore errors here so exit always works.
      await supabase.from("match_queue").delete().in("session_id", sessionIds)
      await supabase.from("match_sessions").delete().in("session_id", sessionIds)
    }

    return json({ status: "ok" })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return json({ error: message }, { status: 500 })
  }
}
