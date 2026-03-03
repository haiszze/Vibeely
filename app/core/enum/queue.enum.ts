export type QueueStatus = {
  status?: "waiting" | "matched" | "exited" | "ok"
  roomId?: string
  matchedSessionId?: string
  error?: string
}