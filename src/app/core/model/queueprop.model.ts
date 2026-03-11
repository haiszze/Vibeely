export interface ExistingRoom {
  room_id: string
  session_1_id: string
  session_2_id: string
}

export interface QueueMatchPayload {
  roomId: string
  matchedSessionId?: string
  createdAt: string
}