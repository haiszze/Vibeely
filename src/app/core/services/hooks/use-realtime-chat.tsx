"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/src/app/core/services/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  userId: string;
  onThemeChange?: (themeId: string) => void;
  onCustomImageReceived?: (dataUrl: string) => void;
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

const EVENT_MESSAGE_TYPE = "message";
const EVENT_PARTNER_LEFT_TYPE = "partner-left";
const EVENT_TYPING_TYPE = "typing";
const EVENT_THEME_TYPE = "theme";

const TYPING_CLEAR_MS = 2000;

export function useRealtimeChat({
  roomName,
  username,
  userId,
  onThemeChange,
  onCustomImageReceived,
}: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep refs so channel listeners always call the latest callbacks
  const onThemeChangeRef = useRef(onThemeChange);
  useEffect(() => { onThemeChangeRef.current = onThemeChange; }, [onThemeChange]);
  const onCustomImageReceivedRef = useRef(onCustomImageReceived);
  useEffect(() => { onCustomImageReceivedRef.current = onCustomImageReceived; }, [onCustomImageReceived]);

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

    // Presence: capture partner name on sync and join
    type PresenceData = { userId: string; username: string; online_at: string };

    const extractPartner = () => {
      const state = newChannel.presenceState<PresenceData>();
      const partner = Object.entries(state)
        .filter(([key]) => key !== userId)
        .flatMap(([, presences]) => presences)[0];
      if (partner?.username) setPartnerUsername(partner.username);
    };

    newChannel.on("presence", { event: "sync" }, extractPartner);
    newChannel.on("presence", { event: "join" }, extractPartner);

    // Typing indicator listener
    newChannel.on("broadcast", { event: EVENT_TYPING_TYPE }, (payload) => {
      if ((payload.payload as { userId: string }).userId === userId) return;
      setIsPartnerTyping(true);
      if (partnerTypingTimer.current) clearTimeout(partnerTypingTimer.current);
      partnerTypingTimer.current = setTimeout(() => {
        setIsPartnerTyping(false);
      }, TYPING_CLEAR_MS);
    });

    // Theme change listener
    newChannel.on("broadcast", { event: EVENT_THEME_TYPE }, (payload) => {
      const { themeId, imageDataUrl } = payload.payload as {
        themeId: string;
        imageDataUrl?: string;
      };
      if (imageDataUrl) {
        onCustomImageReceivedRef.current?.(imageDataUrl);
      } else if (themeId) {
        onThemeChangeRef.current?.(themeId);
      }
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
      if (partnerTypingTimer.current) clearTimeout(partnerTypingTimer.current);
    };
  }, [roomName, supabase, userId, username]);

  const sendTyping = useCallback(() => {
    if (!channel || !isConnected || hasPartnerLeft) return;
    void channel.send({
      type: "broadcast",
      event: EVENT_TYPING_TYPE,
      payload: { userId },
    });
  }, [channel, isConnected, hasPartnerLeft, userId]);

  const sendTheme = useCallback(
    (themeId: string, imageDataUrl?: string | null) => {
      if (!channel || !isConnected || hasPartnerLeft) return;
      void channel.send({
        type: "broadcast",
        event: EVENT_THEME_TYPE,
        payload: imageDataUrl
          ? { themeId, imageDataUrl }
          : { themeId },
      });
    },
    [channel, isConnected, hasPartnerLeft],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected || hasPartnerLeft) return;

      const message: ChatMessage = {
        id: uuidv4(),
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
    sendTyping,
    sendTheme,
    isConnected: isConnected && !hasPartnerLeft,
    hasPartnerLeft,
    partnerUsername,
    isPartnerTyping,
  };
}
