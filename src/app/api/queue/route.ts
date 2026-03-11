'use server'

import { json, logError } from "../../core/services/log/log"
import { UserProp } from "../../core/model/userprop.model"
import { createBrowserClient } from "@supabase/ssr"
import { ExistingRoom } from "../../core/model/queueprop.model"

export interface Body {
  sessionId?: string
  userProp?: UserProp
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function toMatchedResponse(existingRoom: ExistingRoom, sessionId: string) {
  const matchedSessionId =
    existingRoom.session_1_id === sessionId
      ? existingRoom.session_2_id
      : existingRoom.session_1_id

  return {
    status: "matched" as const,
    roomId: existingRoom.room_id,
    matchedSessionId,
  }
}

async function getExistingRoom(cfg: ReturnType<typeof createClient>, sessionId: string) {
  const { data: existingRoom, error: existingRoomError } = await cfg
    .from("match_rooms")
    .select("room_id, session_1_id, session_2_id")
    .or(`session_1_id.eq.${sessionId},session_2_id.eq.${sessionId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingRoom>()

  if (existingRoomError) {
    logError("queue: existing room lookup failed", existingRoomError, { sessionId })
    return { error: existingRoomError.message }
  }

  if (!existingRoom) {
    return { room: null }
  }

  return { room: toMatchedResponse(existingRoom, sessionId) }
}

export async function POST(req: Request) {
  try {
    const cfg = createClient()

    if (!cfg) {
      logError("queue: missing supabase config", "SUPABASE_URL or SERVICE_ROLE_KEY not set")
      return json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action

    // HANDLE TAB CLOSE / REFRESH
    if (action === "leave") {
      const sessionId = body?.sessionId
      const roomId = body?.roomId

      if (sessionId) {
        await cfg
          .from("match_queue")
          .delete()
          .eq("session_id", sessionId)
      }

      if (roomId) {
        await cfg
          .from("match_rooms")
          .delete()
          .eq("room_id", roomId)
      }

      return json({ status: "ok" })
    }

    const sessionId = body!.sessionId
    const universityId = body!.userProp!.university
    const interestIds = body!.userProp!.interests

    // VALIDATION
    if (!sessionId) return json({ error: "Missing sessionId" }, { status: 400 })
    if (!isUuid(sessionId)) return json({ error: "sessionId must be a UUID" }, { status: 400 })
    if (!universityId) return json({ error: "Missing userProp.university" }, { status: 400 })
    if (!Array.isArray(interestIds) || interestIds.length === 0) {
      return json({ error: "userProp.interests must be a non-empty array" }, { status: 400 })
    }

    const existingRoom = await getExistingRoom(cfg, sessionId)

    if ("error" in existingRoom) {
      return json({ error: existingRoom.error }, { status: 500 })
    }

    if (existingRoom.room) {
      return json(existingRoom.room)
    }

    // QUEUE START
    const { error: queueError } = await cfg
      .from("match_queue")
      .upsert(
        { session_id: sessionId, university_id: universityId, interest_ids: interestIds }
      )

    if (queueError) {
      logError("queue: match_queue upsert failed", queueError, { sessionId, universityId })
      return json({ error: queueError.message }, { status: 500 })
    }

    // MATCHING
    const { data: candidates, error: candidatesError } = await cfg
      .from("match_queue")
      .select("session_id, university_id, joined_at")
      .neq("session_id", sessionId)
      .overlaps("interest_ids", interestIds)
      .order("joined_at", { ascending: true })

    if (candidatesError) {
      logError("queue: match_queue candidates select failed", candidatesError, {
        sessionId,
        universityId,
      })
      return json({ error: candidatesError.message }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return json({ status: "waiting" })
    }

    const sameUniversity = candidates.filter((c) => c.university_id === universityId)
    const best = sameUniversity.length > 0 ? sameUniversity[0] : candidates[0]
    const matchedSessionId: string = best.session_id

    if (!isUuid(matchedSessionId)) {
      logError("queue: bad matched session id in queue", "Non-UUID session_id", {
        sessionId,
        matchedSessionId,
      })
      return json({ error: "Matched sessionId is not a UUID (bad data in match_queue)" }, { status: 500 })
    }

    // MOVE TO ROOM 
    const { error: deleteQueueError, count: deletedCount } = await cfg
      .from("match_queue")
      .delete({ count: "exact" })
      .in("session_id", [sessionId, matchedSessionId])

    if (deleteQueueError) {
      logError("queue: match_queue delete failed", deleteQueueError, {
        sessionId,
        matchedSessionId,
      })
      return json({ error: deleteQueueError.message }, { status: 500 })
    }

    if (deletedCount !== 2) {
      return json({ status: "waiting" })
    }

    // CREATE ROOM BASED ON MATCH
    const { data: room, error: roomError } = await cfg
      .from("match_rooms")
      .insert({ session_1_id: sessionId, session_2_id: matchedSessionId })
      .select("room_id")
      .single()

    if (roomError || !room) {
      logError("queue: match_rooms insert failed", roomError ?? "Missing room", {
        sessionId,
        matchedSessionId,
      })
      return json({ error: roomError?.message ?? "Failed to create room" }, { status: 500 })
    }

    return json({
      status: "matched",
      roomId: room.room_id,
      matchedSessionId,
    })

  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    logError("queue: unhandled error", e, { message })
    return json({ error: message }, { status: 500 })
  }
}


export async function DELETE(req: Request) {
  try {
    const cfg = createClient()

    if (!cfg) {
      return json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const body = (await req.json().catch(() => ({}))) as { roomId?: string }
    const roomId = body?.roomId

    if (!roomId) return json({ error: "Missing roomId" }, { status: 400 })
    if (!isUuid(roomId)) return json({ error: "roomId must be a UUID" }, { status: 400 })

    // DELETE ROOM
    const { error: deleteRoomError } = await cfg
      .from("match_rooms")
      .delete()
      .eq("room_id", roomId)

    if (deleteRoomError) return json({ error: deleteRoomError.message }, { status: 500 })

    return json({ status: "ok" })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    logError("queue: unhandled error (delete)", e, { message })
    return json({ error: message }, { status: 500 })
  }
}