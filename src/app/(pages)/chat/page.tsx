"use client";

import { useEffect, useState } from "react";
import { RealtimeChat } from "@/src/app/components/supabase/realtime-chat";
import { getSession } from "@/src/app/core/services/session/session";
import { useRouter } from "next/navigation";
import {
  joinQueue,
  notifyQueueMatch,
  subscribeToQueueMatch,
} from "@/src/app/core/services/api/queue/queue-client";
import { Loading } from "../../components/loading/loading";

export default function ChatPage() {
  const router = useRouter();

  const [session, setSession] = useState<
    ReturnType<typeof getSession> | undefined
  >(undefined);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [broadcastReady, setBroadcastReady] = useState(false);

  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/interest");
  }, [session, router]);

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

    let cancelled = false;

    async function sessionQueue() {
      const data = await joinQueue(session!.sessionId, {
        name: session!.userProp.name,
        interests: session!.userProp.interests,
        university: session!.userProp.university,
      });

      if (!data) return;

      if (data.status === "matched" && data.roomId) {
        if (data.matchedSessionId) {
          await notifyQueueMatch(data.matchedSessionId, {
            roomId: `${data.roomId}${key}`,
            matchedSessionId: session?.sessionId,
          });
        }

        setRoomId(`${data.roomId}${key}`);
        return;
      }
    }

    void sessionQueue();

    return () => {
      cancelled = true;
    };
  }, [broadcastReady, roomId, session]);

  useEffect(() => {
    if (!session) return;

    const leave = () => {
      navigator.sendBeacon(
        "/api/queue",
        new Blob(
          [
            JSON.stringify({
              action: "leave",
              sessionId: session.sessionId,
              roomId,
            }),
          ],
          { type: "application/json" },
        ),
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        leave();
      }
    };

    window.addEventListener("beforeunload", leave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, roomId]);

  if (session === null) return null;

  if (!roomId) {
    return (
      <Loading />
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
