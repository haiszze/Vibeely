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

export function useRealtimeChat({
  roomName,
  username,
  userId,
}: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);

  useEffect(() => {
    setIsConnected(false);
    setHasPartnerLeft(false);

    const newChannel = supabase.channel(roomName, {
      config: { presence: { key: userId } },
    });

    // Message listener
    newChannel.on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
      setMessages((current) => [...current, payload.payload as ChatMessage]);
    });

    // Presence handling
    const trackUser = async () => {
      await newChannel.track({
        userId,
        username,
        online_at: new Date().toISOString(),
      });
    };

    newChannel
      .on("presence", { event: "leave" }, (payload) => {
        const leftUsers = payload.leftPresences.map((p) => p.key);
        const partnerLeft = leftUsers.some((id) => id !== userId);

        if (partnerLeft) {
          setHasPartnerLeft(true);
          setIsConnected(false);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          await trackUser();
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomName, supabase, userId, username]);

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

  return {
    messages,
    sendMessage,
    isConnected: isConnected && !hasPartnerLeft,
    hasPartnerLeft
  };
}
