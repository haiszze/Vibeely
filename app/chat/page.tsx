"use client"

import { useEffect, useState } from "react"
import { RealtimeChat } from "@/components/supabase/realtime-chat"
import { getSession } from "@/app/core/services/session/session"
import { useRouter } from "next/navigation"

type QueueResponse =
  | { status: "waiting"; room_id: null; matched_session_id: null }
  | { status: "matched"; room_id: string; matched_session_id: string }
  | { error: string }

export default function ChatPage() {
  const router = useRouter()

  // IMPORTANT: don't call getSession() during render (causes hydration mismatch)
  const [session, setSession] = useState<ReturnType<typeof getSession> | undefined>(undefined)
  const [roomId, setRoomId] = useState<string | null>(null)

  // Load session on client after mount
  useEffect(() => {
    setSession(getSession())
  }, [])

  // Redirect if no session (after we've loaded it on client)
  useEffect(() => {
    if (session === null) router.replace("/interest")
  }, [session, router])

  // Poll queue only when we have a session
  useEffect(() => {
    if (!session) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let stopped = false
    let inFlight = false
    const controller = new AbortController()
    const currentSession = session

    async function tick() {
      if (stopped || inFlight) return
      inFlight = true

      try {
        const res = await fetch("/core/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            sessionId: currentSession.sessionId,
            userProp: {
              interests: currentSession.userProp.interests,
              university: currentSession.userProp.university,
            },
          }),
        })

        let data: QueueResponse
        try {
          data = (await res.json()) as QueueResponse
        } catch {
          console.error("queue error: invalid JSON response")
          return
        }

        if (!res.ok) {
          console.error("queue error:", "error" in data ? data.error : `HTTP ${res.status}`)
          return
        }

        if ("error" in data) {
          console.error("queue error:", data.error)
          return
        }

        if (data.status === "matched") {
          setRoomId(data.room_id)
          return
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("queue error:", e)
        }
        return
      } finally {
        inFlight = false
      }

      if (!stopped) timer = setTimeout(tick, 1500)
    }

    tick()

    return () => {
      stopped = true
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [session])

  if (session === null) return null

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div>Finding a match...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col gap-3">
        <div className="w-full border border-gray-300">
          <RealtimeChat roomName={roomId} username={session!.userProp.name} />
        </div>
      </div>
    </div>
  )
}