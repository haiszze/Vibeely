"use client";

import { LogOut, RefreshCw, Send } from "lucide-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/src/app/lib/utils";
import { ChatMessageItem } from "@/src/app/components/supabase/chat-message";
import { useChatScroll } from "@/src/app/core/services/hooks/use-chat-scroll";
import {
  useRealtimeChat,
  type ChatMessage,
} from "@/src/app/core/services/hooks/use-realtime-chat";
import { Button } from "@/src/app/components/ui/button";
import { Input } from "@/src/app/components/ui/input";
import { logError } from "@/src/app/core/services/log/log";
import { useRouter } from "next/navigation";
import { clearMatchTables } from "@/src/app/core/services/api/queue/queue-client";
import { useChatTheme } from "@/src/app/core/services/hooks/use-chat-theme";
import { ChatThemePicker } from "@/src/app/components/chat/chat-theme-picker";
import { ThemeToggle } from "@/src/app/components/theme/theme-toggle";

interface RealtimeChatProps {
  userId: string;
  roomName: string;
  username: string;
  onNextQueue?: () => void;
}

export const RealtimeChat = ({
  userId,
  roomName,
  username,
  onNextQueue,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();
  const router = useRouter();

  const { theme, setTheme, customImageUrl, setCustomImage } = useChatTheme();

  const {
    messages,
    sendMessage,
    sendTyping,
    sendTheme,
    isConnected,
    hasPartnerLeft,
    partnerUsername,
    isPartnerTyping,
  } = useRealtimeChat({
    roomName,
    username,
    userId,
    onThemeChange: setTheme,
    onCustomImageReceived: setCustomImage,
  });

  const [newMessage, setNewMessage] = useState("");

  // Select a preset theme — set locally and broadcast to partner
  const handleSelectTheme = useCallback(
    (id: string) => {
      setTheme(id);
      sendTheme(id);
    },
    [setTheme, sendTheme],
  );

  // Upload a custom image — store locally and broadcast compressed data to partner
  const handleImageUpload = useCallback(
    (dataUrl: string) => {
      setCustomImage(dataUrl);
      sendTheme("custom", dataUrl);
    },
    [setCustomImage, sendTheme],
  );

  // Remove custom image — reset locally and tell partner to go back to default
  const handleImageRemove = useCallback(() => {
    setCustomImage(null);
    sendTheme("default");
  }, [setCustomImage, sendTheme]);

  // Broadcast our saved theme to the partner the moment they join.
  // Using refs so the effect closure never goes stale.
  const themeRef = useRef(theme);
  const customImageUrlRef = useRef(customImageUrl);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    customImageUrlRef.current = customImageUrl;
  }, [customImageUrl]);

  useEffect(() => {
    if (!partnerUsername) return;
    const t = themeRef.current;
    const img = customImageUrlRef.current;
    if (t.id === "custom" && img) {
      sendTheme("custom", img);
    } else if (t.id !== "default") {
      sendTheme(t.id);
    }
    // intentionally omit sendTheme — it’s stable after connection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerUsername]);

  const partnerName = useMemo(() => {
    return (
      messages.find((m) => m.user.id !== userId)?.user.name ?? partnerUsername
    );
  }, [messages, userId, partnerUsername]);

  // Single source of truth for "can the user send a message right now?" —
  // used by the input, the send guard, and the submit button so they can
  // never drift out of sync with each other.
  const isChatDisabled =
    !isConnected || hasPartnerLeft || partnerUsername == null;

  // With `interactive-widget=resizes-content` set in the root layout, iOS
  // Safari now shrinks the actual layout viewport (and therefore `h-dvh`)
  // when the keyboard opens, so the flex layout below resizes correctly on
  // its own — no manual height/position overrides needed. We still listen
  // for visualViewport changes purely to keep the latest message scrolled
  // into view as the keyboard opens/closes.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => scrollToBottom();

    vv.addEventListener("resize", handleViewportChange);
    return () => vv.removeEventListener("resize", handleViewportChange);
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping, hasPartnerLeft, scrollToBottom]);

  // When the partner leaves (detected via presence), delete the room from the
  // DB immediately from this side. This covers cases where the partner closed
  // or navigated the tab before their own 15-second background timer fired.
  useEffect(() => {
    if (!hasPartnerLeft) return;
    void (async () => {
      try {
        await clearMatchTables(null, roomName);
      } catch {
        logError("room: partner-left cleanup failed");
      }
    })();
  }, [hasPartnerLeft, roomName]);

  // Background-tab timeout: if the page stays hidden for 15 s, clean up the
  // room so the partner isn't left waiting, then redirect home on return.
  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hasPartnerLeft) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        bgTimerRef.current = setTimeout(() => {
          void (async () => {
            try {
              await clearMatchTables(userId, roomName);
            } catch {
              logError("room: background timeout cleanup failed");
            } finally {
              startTransition(() => {
                router.replace("/");
              });
            }
          })();
        }, 15_000);
      } else {
        if (bgTimerRef.current) {
          clearTimeout(bgTimerRef.current);
          bgTimerRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (bgTimerRef.current) {
        clearTimeout(bgTimerRef.current);
        bgTimerRef.current = null;
      }
    };
  }, [hasPartnerLeft, userId, roomName, router]);

  const handleExit = useCallback(() => {
    startTransition(() => {
      router.replace("/");
    });

    void (async () => {
      try {
        await clearMatchTables(null, roomName);
      } catch {
        logError("room: exit cleanup failed");
      }
    })();
  }, [roomName, router]);

  const handleNextQueue = useCallback(() => {
    startTransition(() => {
      onNextQueue?.();
    });

    void (async () => {
      try {
        // Pass both sessionId and roomId so the room row is always deleted
        await clearMatchTables(userId, roomName);
      } catch {
        logError("room: next-queue cleanup failed");
      }
    })();
  }, [userId, roomName, onNextQueue]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || isChatDisabled) return;
      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isChatDisabled, sendMessage],
  );

  return (
    <div className="flex flex-col h-svh">
      <header className="glass-panel relative overflow-hidden flex items-center justify-between shrink-0 border-b px-4 py-3 before:absolute before:inset-0 before:bg-linear-to-b before:from-white/70 dark:before:from-white/15 before:to-transparent before:pointer-events-none">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="size-9 shrink-0 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold select-none"
          >
            {partnerName ? partnerName.charAt(0).toUpperCase() : null}
          </div>

          <div className="flex flex-col leading-tight">
            {partnerName ? (
              <span className="text-sm font-semibold">{partnerName}</span>
            ) : (
              <span className="h-3.5 w-20 rounded bg-muted animate-pulse" />
            )}
            <span
              className={cn(
                "text-xs",
                hasPartnerLeft
                  ? "text-destructive"
                  : isConnected
                    ? "text-emerald-500"
                    : "text-muted-foreground",
              )}
            >
              {hasPartnerLeft
                ? "Left the chat"
                : isConnected
                  ? "Online"
                  : "Connecting…"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ChatThemePicker
            currentThemeId={theme.id}
            customImageUrl={customImageUrl}
            onSelect={handleSelectTheme}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
          <div className="w-px h-4 bg-border" />
          <ThemeToggle />
        </div>
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        style={theme.style}
      >
        {!hasPartnerLeft && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Someone who shares your vibe {username}.
            </p>
          </div>
        )}

        <div className="space-y-0.5">
          {messages.map((message, index) => {
            const prev = index > 0 ? messages[index - 1] : null;
            const showHeader = !prev || prev.user.id !== message.user.id;
            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.id === userId}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>

        {isPartnerTyping && !hasPartnerLeft && (
          <div className="flex items-end gap-2 px-1 mt-1.5 animate-in fade-in duration-200">
            <div className="glass-panel rounded-2xl rounded-bl-sm border px-4 py-2.5 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {hasPartnerLeft && (
          <div className="flex justify-center py-6">
            <div className="glass-panel-strong rounded-2xl border px-6 py-5 text-center max-w-xs relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-b before:from-white/70 dark:before:from-white/15 before:to-transparent before:pointer-events-none">
              <p className="text-sm font-semibold mb-1">
                {partnerName ?? "Your match"} left the chat
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                The conversation has ended. Find a new match.
              </p>
              <div className="flex flex-col gap-2">
                {onNextQueue && (
                  <Button
                    size="lg"
                    onClick={handleNextQueue}
                    className="gap-1.5 bg-linear-to-r from-primary to-secondary text-white border-0 hover:opacity-90"
                  >
                    <RefreshCw className="size-3.5" />
                    Find New Match
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleExit}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel relative overflow-hidden shrink-0 border-t before:absolute before:inset-0 before:bg-linear-to-b before:from-white/70 dark:before:from-white/15 before:to-transparent before:pointer-events-none">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="glass-panel h-9 w-9 shrink-0 rounded-full border p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Exit chat"
          >
            <LogOut className="size-4" />
          </Button>

          {onNextQueue && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextQueue}
              className="glass-panel h-9 shrink-0 rounded-small border px-4 text-muted-foreground hover:text-primary hover:bg-primary/10"
              aria-label="Find new match"
            >
              Next
            </Button>
          )}

          <Input
            className={cn(
              "glass-panel flex-1 rounded-small border p-4 text-base transition-all duration-300",
              isChatDisabled && "opacity-50 cursor-not-allowed",
            )}
            style={{ fontSize: 16 }}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              sendTyping();
            }}
            placeholder={
              hasPartnerLeft
                ? "Partner left the chat"
                : partnerUsername == null
                  ? "Waiting for a partner..."
                  : `Send a message to ${partnerName}`
            }
            disabled={isChatDisabled}
          />

          {!isChatDisabled && newMessage.trim() && (
            <Button
              type="submit"
              className="aspect-square rounded-full shrink-0 animate-in fade-in slide-in-from-right-2 duration-200 bg-linear-to-br from-primary to-secondary text-white border-0 hover:opacity-90"
            >
              <Send className="size-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};