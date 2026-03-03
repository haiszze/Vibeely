"use client"

import { useEffect, useState } from "react"
import { RealtimeChat } from "@/components/supabase/realtime-chat"
import { getSession } from "@/app/services/session/session"
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

    async function tick() {
      if (stopped) return

      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session!.sessionId,
          userProp: {
            interests: session!.userProp.interests,
            university: session!.userProp.university,
            name: session!.userProp.name, // harmless if server ignores; keep if your payload expects it
          },
        }),
      })

      const data: QueueResponse = await res.json()

      if ("error" in data) {
        console.error("queue error:", data.error)
        return
      }

      if (data.status === "matched") {
        setRoomId(data.room_id)
        return
      }

      timer = setTimeout(tick, 1500)
    }

    tick()

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [session])

  // While determining session on client, render a stable placeholder (prevents hydration mismatch)
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div>Loading...</div>
      </div>
    )
  }

  // If session is null, redirect effect will run; render nothing
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
          <RealtimeChat roomName={roomId} username={session.userProp.name} />
        </div>
      </div>
    </div>
  )
}