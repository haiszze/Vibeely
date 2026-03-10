import { NextResponse } from "next/server"
import { QueueStatus } from "../../enum/queue.enum"
import { logError } from "../../services/log/log"
import { createClient } from "../../services/supabase/client"
import { UserProp } from "../../model/userprop.model"

export interface Body {
  sessionId?: string
  userProp?: UserProp
}

function json(data: QueueStatus, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function POST(req: Request) {
  try {
    const cfg = createClient("servicerole");

    if (!cfg) {
      logError("queue: missing supabase config", "SUPABASE_URL or SERVICE_ROLE_KEY not set")
      return json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const body = (await req.json().catch(() => ({}))) as Body

    const sessionId = body?.sessionId
    const universityId = body?.userProp?.university
    const interestIds = body?.userProp?.interests

    // VALIDATION
    if (!sessionId) return json({ error: "Missing sessionId" }, { status: 400 })
    if (!isUuid(sessionId)) return json({ error: "sessionId must be a UUID" }, { status: 400 })
    if (!universityId) return json({ error: "Missing userProp.university" }, { status: 400 })
    if (!Array.isArray(interestIds) || interestIds.length === 0) {
      return json({ error: "userProp.interests must be a non-empty array" }, { status: 400 })
    }

    // EXISTING ROOM CHECK
    const { data: existingRoom, error: existingRoomError } = await cfg
      .from("match_rooms")
      .select("room_id, session_1_id, session_2_id")
      .or(`session_1_id.eq.${sessionId},session_2_id.eq.${sessionId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingRoomError) {
      logError("queue: existing room lookup failed", existingRoomError, { sessionId })
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
      return json({ status: "waiting"})
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
      matchedSessionId: matchedSessionId,
    })

  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    logError("queue: unhandled error", e, { message })
    return json({ error: message }, { status: 500 })
  }
}


export async function DELETE(req: Request) {
  try {
    const cfg = createClient("servicerole")

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