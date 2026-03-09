'use client'

import { LogOut, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { cn } from '@/src/app/lib/utils'
import { ChatMessageItem } from '@/src/app/components/supabase/chat-message'
import { useChatScroll } from '@/src/app/core/services/hooks/use-chat-scroll'
import {
  useRealtimeChat,
  type ChatMessage,
} from '@/src/app/core/services/hooks/use-realtime-chat'
import { Button } from '@/src/app/components/ui/button'
import { Input } from '@/src/app/components/ui/input'
import { removeSession } from '@/src/app/core/services/session/session'
import { logError } from '@/src/app/core/services/log/log'
import { useRouter } from 'next/navigation'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()
  const router = useRouter()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    hasPartnerLeft,
    notifyPartnerLeft,
  } = useRealtimeChat({
    roomName,
    username,
  })
  const [newMessage, setNewMessage] = useState('')

  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]

    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )

    return uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  useEffect(() => {
    if (!hasPartnerLeft) return

    removeSession()
    router.replace('/interest')
  }, [hasPartnerLeft, router])

  const handleExit = useCallback(() => {
    removeSession()
    router.replace('/interest')

    void (async () => {
      try {
        await Promise.allSettled([
          notifyPartnerLeft(),
          fetch('/core/api/queue', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({ roomId: roomName }),
          }),
        ])
      } catch {
        logError('room: exit cleanup failed')
      }
    })()
  }, [notifyPartnerLeft, roomName, router])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!newMessage.trim() || !isConnected || hasPartnerLeft) return

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, hasPartnerLeft, sendMessage]
  )
  

  return (
    <div className="flex flex-col h-[60vh] w-full bg-background text-foreground antialiased">
      <div ref={containerRef} className="flex-1 overflow-y-auto w-[60vw] p-4 space-y-4">
        {hasPartnerLeft ? (
          <div className="text-center text-sm text-muted-foreground">
            Your partner left the chat.
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}

        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-1 border-t border-border p-4">

        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          type="button"
          className="text-destructive hover:text-destructive p-1"
        >
          <LogOut className="size-5" />
        </Button>

        
        <Input
          className={cn(
            'rounded-full bg-background text-sm transition-all duration-300',
            isConnected && newMessage.trim() ? 'w-[calc(100%-36px)]' : 'w-full'
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={hasPartnerLeft ? 'Partner left the chat' : 'Type a message...'}
          disabled={!isConnected || hasPartnerLeft}
        />

        {isConnected && !hasPartnerLeft && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected || hasPartnerLeft}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
