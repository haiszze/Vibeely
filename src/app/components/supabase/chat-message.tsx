"use client";

import { cn } from "@/src/app/lib/utils";
import type { ChatMessage } from "@/src/app/core/services/hooks/use-realtime-chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
}: ChatMessageItemProps) => {
  const timeLabel = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className={cn(
        "flex px-1",
        showHeader ? "mt-3 first:mt-0" : "mt-1.5",
        isOwnMessage ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn("max-w-[75%] flex flex-col gap-0.5", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn(
              "flex items-center gap-2 px-1 text-xs text-muted-foreground",
              isOwnMessage ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span className="font-medium text-foreground/70">{message.user.name}</span>
            <span suppressHydrationWarning>{timeLabel}</span>
          </div>
        )}

        <div
          className={cn(
            "relative group w-fit max-w-full px-3.5 py-2 rounded-2xl text-sm leading-relaxed wrap-break-word",
            "backdrop-blur-xl shadow-sm overflow-hidden",
            isOwnMessage
              ? [
                  "rounded-br-sm text-foreground",
                  "bg-black/5 dark:bg-white/8",
                  "border border-black/10 dark:border-white/15",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.08),0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)]",
                  "before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-b before:from-white/70 dark:before:from-white/30 before:to-transparent before:pointer-events-none",
                ].join(" ")
              : [
                  "rounded-bl-sm text-foreground",
                  "bg-black/5 dark:bg-white/8",
                  "border border-black/10 dark:border-white/15",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.08),0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)]",
                  "before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-b before:from-white/70 dark:before:from-white/30 before:to-transparent before:pointer-events-none",
                ].join(" "),
          )}
        >
          {message.content}

          {!showHeader && (
            <span
              className={cn(
                "absolute -bottom-4 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                isOwnMessage ? "right-1" : "left-1",
              )}
              suppressHydrationWarning
            >
              {timeLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

