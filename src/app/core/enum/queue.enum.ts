export type QueueStatus = {
  status?: "waiting" | "matched" | "exited"
  roomId?: string
  matchedSessionId?: string
  error?: string
}