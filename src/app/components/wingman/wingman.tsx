"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Send, Sparkles, X } from "lucide-react";

import { cn } from "@/src/app/lib/utils";
import { Button } from "@/src/app/components/ui/button";
import type { ChatMessage } from "@/src/app/core/services/hooks/use-realtime-chat";

interface WingmanProps {
  messages: ChatMessage[];
  currentUserId: string;
  partnerName?: string;
}

const QUICK_PROMPTS = [
  "Help me open",
  "Keep it going",
  "I'm stuck, help",
  "Make it fun",
];

export default function Wingman({ messages, currentUserId, partnerName }: WingmanProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Ref-based lock prevents race conditions where two submits sneak past the state check
  const loadingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const buildContext = useCallback((): string => {
    if (messages.length === 0) return "No messages yet.";
    return messages
      .slice(-10)
      .map((m) => `${m.user.id === currentUserId ? "Me" : (partnerName ?? "Match")}: ${m.content}`)
      .join("\n");
  }, [messages, currentUserId, partnerName]);

  const askWingman = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || loadingRef.current) return;
      loadingRef.current = true;
      setIsLoading(true);
      setResponse("");

      try {
        const res = await fetch("/api/wingman", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            context: buildContext(),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          const isQuota = res.status === 429;
          setResponse(
            isQuota
              ? "Wingman hit its daily quota. Let me rest broskie"
              : (err.error ?? "Wingman hit an error. Please try again."),
          );
          return;
        }

        const text = await res.text();
        setResponse(text);
      } catch {
        setResponse("Sorry, the wingman is unavailable right now.");
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [buildContext],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    void askWingman(trimmed);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden border-t border-black/10 dark:border-white/15 transition-colors duration-200",
        isOpen &&
          "bg-black/6 dark:bg-white/8 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_-1px_0_rgba(255,255,255,0.04)] before:absolute before:inset-0 before:bg-linear-to-b before:from-white/55 before:via-white/12 before:to-transparent dark:before:from-white/8 dark:before:via-transparent dark:before:to-transparent before:pointer-events-none",
      )}
    >
      {/* Toggle bar */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="size-3.5 text-primary" />
          Wingman AI
          {isLoading && (
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </span>
        {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
      </button>

      {/* Expandable panel */}
      {isOpen && (
        <div className="relative z-10 px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">

          {/* Quick prompts */}
          {!isLoading && !response && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => void askWingman(qp)}
                  className="rounded-full border border-black/10 dark:border-white/12 bg-black/6 dark:bg-white/10 backdrop-blur-xl px-2.5 py-1 text-[11px] text-foreground/70 dark:text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_6px_18px_rgba(0,0,0,0.10)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(0,0,0,0.28)] hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Response area */}
          {(response || isLoading) && (
            <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/12 bg-black/6 dark:bg-white/10 backdrop-blur-2xl p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(0,0,0,0.08),0_10px_30px_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.03),0_14px_34px_rgba(0,0,0,0.32)] before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-b before:from-white/60 before:via-white/10 before:to-transparent dark:before:from-white/8 dark:before:via-transparent dark:before:to-transparent before:pointer-events-none">
              {isLoading && !response && (
                <span className="relative z-10 text-foreground/70 dark:text-white/75 text-xs animate-pulse">
                  Wingman is thinking…
                </span>
              )}
              {response && (
                <>
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setResponse("")}
                    className="absolute right-2 top-2 z-10 text-foreground/60 dark:text-white/65 hover:text-foreground dark:hover:text-white transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                  <p className="relative z-10 pr-5 text-sm leading-relaxed whitespace-pre-line text-foreground dark:text-white/90">
                    {response}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Free-form input — only fires on explicit submit, not on keystroke */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Ask your wingman…"
              disabled={isLoading}
              className="flex-1 rounded-lg border border-black/10 dark:border-white/12 bg-black/6 dark:bg-white/10 backdrop-blur-2xl px-3 py-1.5 text-xs text-foreground dark:text-white/90 placeholder:text-foreground/45 dark:placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(0,0,0,0.08),0_10px_30px_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.03),0_14px_34px_rgba(0,0,0,0.32)]"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={isLoading || !input.trim()}
              className="px-2 text-primary hover:text-primary disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
