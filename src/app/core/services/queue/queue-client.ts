import { QueueStatus } from "@/src/app/core/enum/queue.enum"
import { logError } from "@/src/app/core/services/log/log"
import { createClient } from "../supabase/client"
import { UserProp } from "../../model/userprop.model"

export async function joinQueue(
    sessionId: string,
    userProp: UserProp,
): Promise<QueueStatus | null> {
    try {
        const baseUrl = createClient()

        const res = await fetch('/api/queue', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({sessionId, userProp}),
        })

        let data: QueueStatus

        try {
            data = (await res.json()) as QueueStatus
        } catch {
            logError("queue: invalid JSON response")
            return null
        }

        if (!res.ok) {
            logError("queue: http error", "error" in data ? data.error : `HTTP ${res.status}`)
            return null
        }

        if ("error" in data) {
            logError("queue: api error", data.error)
            return null
        }

        return data
    } catch (e) {
        logError("queue: request failed", e)
        return null
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