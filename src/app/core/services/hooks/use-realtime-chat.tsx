"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/src/app/core/services/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

type PartnerLeftPayload = {
  username: string;
  createdAt: string;
};

const EVENT_MESSAGE_TYPE = "message";
const EVENT_PARTNER_LEFT_TYPE = "partner-left";

export function useRealtimeChat({ roomName, username, userId }: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);

  useEffect(() => {
    setIsConnected(false);
    setHasPartnerLeft(false);

    const newChannel = supabase.channel(roomName);

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage]);
      })
      .on("broadcast", { event: EVENT_PARTNER_LEFT_TYPE }, () => {
        setHasPartnerLeft(true);
        setIsConnected(false);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomName, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected || hasPartnerLeft) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          id: userId,
          name: username,
        },
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, message]);

      await channel.send({
        type: "broadcast",
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      });
    },
    [channel, isConnected, hasPartnerLeft, username, userId],
  );

  const notifyPartnerLeft = useCallback(async () => {
    if (!channel) return;

    const payload: PartnerLeftPayload = {
      username,
      createdAt: new Date().toISOString(),
    };

    await channel.send({
      type: "broadcast",
      event: EVENT_PARTNER_LEFT_TYPE,
      payload,
    });
  }, [channel, username]);

  return {
    messages,
    sendMessage,
    isConnected: isConnected && !hasPartnerLeft,
    hasPartnerLeft,
    notifyPartnerLeft,
  };
}
