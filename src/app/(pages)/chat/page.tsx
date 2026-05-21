"use client";

import { useCallback, useEffect, useState } from "react";
import { RealtimeChat } from "@/src/app/components/supabase/realtime-chat";
import { getSession, Session } from "@/src/app/core/services/session/session";
import { useRouter } from "next/navigation";
import {
  joinQueue,
  notifyQueueMatch,
  subscribeToQueueMatch,
} from "@/src/app/core/services/api/queue/queue-client";
import dynamic from "next/dynamic";


const Loading = dynamic(
  () =>
    import("../../components/loading/loading").then((m) => ({
      default: m.Loading,
    })),
  { ssr: false },
);

export default function ChatPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [broadcastReady, setBroadcastReady] = useState(false);

  // Read session only on the client so server + client first-render match
  useEffect(() => {
    const s = getSession();
    setSession(s);
    setMounted(true);
    if (s === null) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!session || roomId) return;

    const unsubscribe = subscribeToQueueMatch(
      session.sessionId,
      (payload) => {
        const nextRoomId = payload.roomId;
        if (typeof nextRoomId === "string") {
          setRoomId(nextRoomId);
        }
      },
      (status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR") {
          setBroadcastReady(true);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, session]);

  useEffect(() => {
    if (!session || roomId || !broadcastReady) return;

    async function sessionQueue() {
      const data = await joinQueue(session!.sessionId, {
        name: session!.userProp.name,
        interests: session!.userProp.interests,
      });

      if (!data) return;

      if (data.status === "matched" && data.roomId) {
        if (data.matchedSessionId) {
          await notifyQueueMatch(data.matchedSessionId, {
            roomId: data.roomId,
            matchedSessionId: session?.sessionId,
          });
        }

        setRoomId(data.roomId);
        return;
      }
    }

    void sessionQueue();
  }, [broadcastReady, roomId, session]);

  const handleNextQueue = useCallback(() => {
    // Reset roomId → re-triggers subscription and queue-join effects
    setRoomId(null);
  }, []);

  if (!mounted || session === null) return null;

  if (!roomId) {
    return (
      <Loading
        userName={session.userProp.name}
        interests={session.userProp.interests}
      />
    );
  }

  return (
    <RealtimeChat
      roomName={roomId}
      username={session.userProp.name}
      userId={session.sessionId}
      onNextQueue={handleNextQueue}
    />
  );
}
