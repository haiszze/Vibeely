"use client";

import { useEffect, useState } from "react";
import { RealtimeChat } from "@/src/app/components/supabase/realtime-chat";
import { getSession } from "@/src/app/core/services/session/session";
import { createClient } from "@/src/app/core/services/supabase/client";
import { useRouter } from "next/navigation";
import { QueueStatus } from "../../core/enum/queue.enum";
import { logError } from "@/src/app/core/services/log/log";
import { joinQueue } from "@/src/app/core/services/queue/queue-client";

const POLL_INTERVAL = 500;

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<
    ReturnType<typeof getSession> | undefined
  >(undefined);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [broadcastReady, setBroadcastReady] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/interest");
  }, [session, router]);

  // Subscribe to match broadcasts for instant notification
  useEffect(() => {
    if (!session || roomId) return;

    const channel = supabase
      .channel(`match-notify:${session.sessionId}`)
      .on("broadcast", { event: "match" }, (payload) => {
        const nextRoomId = payload.payload?.roomId;
        if (typeof nextRoomId === "string") {
          setRoomId(nextRoomId);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR") {
          setBroadcastReady(true);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, session, supabase]);

  // Poll queue with fallback to broadcast
  useEffect(() => {
    if (!session || roomId || !broadcastReady) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let inFlight = false;
    let matched = false;
    const currentSession = session;

    async function tick() {
      if (stopped || inFlight) return;
      inFlight = true;

      try {
        const data = await joinQueue({
          sessionId: currentSession.sessionId,
          userProp: {
            interests: currentSession.userProp.interests,
            university: currentSession.userProp.university,
          },
        });

        if (!data) return;

        if (data.status === "matched" && data.roomId) {
          matched = true;
          stopped = true;
          setRoomId(data.roomId);
          return;
        }
      } finally {
        inFlight = false;
        if (!stopped && !matched) {
          timer = setTimeout(tick, POLL_INTERVAL);
        }
      }
    }

    tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [broadcastReady, roomId, session]);

  if (session === null) return null;

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div>Finding a match...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="flex flex-col gap-3">
        <div className="w-full border border-gray-300">
          <RealtimeChat
            roomName={roomId}
            username={session!.userProp.name}
            userId={session!.sessionId}
          />
        </div>
      </div>
    </div>
  );
}
