"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RealtimeChat } from "@/components/supabase/realtime-chat"
import { ChatMessageItem } from "@/components/supabase/chat-message"
import { useState } from "react"

export default function ChatPage() {
  const [name, setName] = useState("")
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col gap-3">
          <input type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full max-w-md mx-auto border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="w-full border border-gray-300">
            <RealtimeChat roomName="rando" username={name}/>
          </div>
      </div>
    </div>
  )
}