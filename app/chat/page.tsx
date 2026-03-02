"use client"

import { useEffect } from "react"
import { RealtimeChat } from "@/components/supabase/realtime-chat"
import { getSession } from "@/services/session/session"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const session = getSession()
  const router = useRouter()
  
  useEffect(() => {
    if (!session) {
      router.push("/interest")
    }
  }, [session, router])
  
  if (!session) {
    return null
  }

  const name = session.userProp.name

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col gap-3">
          <div className="w-full border border-gray-300">
            <RealtimeChat roomName="rando" username={name}/>
          </div>
      </div>
    </div>
  )
}