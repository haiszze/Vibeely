import { QueueStatus } from "@/src/app/core/enum/queue.enum"
import { logError } from "@/src/app/core/services/log/log"
import { createClient } from "../../supabase/client"
import { UserProp } from "../../../model/userprop.model"

const MATCH_EVENT_TYPE = "match"

async function parseQueueResponse(res: Response): Promise<QueueStatus | null> {
  let data: QueueStatus

  try {
    data = (await res.json()) as QueueStatus
  } catch {
    logError("queue: invalid JSON response")
    return null
  }

  if ("error" in data) {
    logError("queue: api error", data.error)
    return data
  }

  return data
}

export async function joinQueue(
  sessionId: string,
  userProp: UserProp,
): Promise<QueueStatus | null> {
  try {
    const res = await fetch('/api/queue', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ sessionId, userProp }),
    })

    return parseQueueResponse(res)
  } catch (e) {
    logError("queue: request failed", e)
    return null
  }
}

export function subscribeToQueueMatch(
  sessionId: string,
  onMatch: (payload: QueueStatus) => void,
  onStatusChange?: (status: string) => void,
) {
  const supabase = createClient()
  const channel = supabase
    .channel(sessionId)
    .on("broadcast", { event: MATCH_EVENT_TYPE }, (payload) => {
      const roomId = payload.payload?.roomId

      if (typeof roomId !== "string") {
        return
      }

      onMatch(payload.payload as QueueStatus)
    })

  channel.subscribe((status) => {
    onStatusChange?.(status)
  })

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function notifyQueueMatch(
  targetSessionId: string,
  payload: QueueStatus,
) {
  const supabase = createClient()
  const channel = supabase.channel(targetSessionId)

  try {
    await channel.send({
      type: "broadcast",
      event: MATCH_EVENT_TYPE,
      payload,
    })

    return true
  } catch (e) {
    logError("queue: failed to notify matched session", e, { targetSessionId })
    return false
  } finally {
    void supabase.removeChannel(channel)
  }
}

export async function leaveRoom(roomId: string) {
  try {
    await fetch("/api/queue", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ roomId }),
    })
  } catch (e) {
    logError("queue: leave room failed", e)
  }
}