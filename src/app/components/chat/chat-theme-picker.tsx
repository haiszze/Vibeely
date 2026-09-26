"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Palette, Trash2, X } from "lucide-react";

import { cn } from "@/src/app/lib/utils";
import { CHAT_THEMES } from "@/src/app/core/services/hooks/use-chat-theme";

const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB — reject truly huge files before canvas

/** Resize + re-encode as JPEG so the data URL is small enough to broadcast. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
        else { w = Math.round((w * MAX) / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load failed")); };
    img.src = url;
  });
}

interface ChatThemePickerProps {
  currentThemeId: string;
  customImageUrl: string | null;
  imageOpacity: number;
  onSelect: (id: string) => void;
  onImageUpload: (dataUrl: string) => void;
  onImageRemove: () => void;
  onOpacityChange: (opacity: number) => void;
}

export function ChatThemePicker({
  currentThemeId,
  customImageUrl,
  imageOpacity,
  onSelect,
  onImageUpload,
  onImageRemove,
  onOpacityChange,
}: ChatThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > MAX_RAW_BYTES) {
      setUploadError("Image must be under 10 MB.");
      return;
    }
    try {
      const compressed = await compressImage(file);
      onImageUpload(compressed);
      setOpen(false);
    } catch {
      setUploadError("Failed to process image.");
    }
    e.target.value = "";
  }

  const current = CHAT_THEMES.find((t) => t.id === currentThemeId);
  const isCustom = currentThemeId === "custom";

  const panel = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-9998" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div
        className="fixed z-9999 w-64 rounded-2xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-4"
        style={{ top: pos.top, right: pos.right }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Chat Theme</span>
          <button
            onClick={() => setOpen(false)}
            className="size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="size-3" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {CHAT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onSelect(theme.id);
                setOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl transition-all",
                currentThemeId === theme.id
                  ? "ring-2 ring-primary bg-primary/10"
                  : "hover:bg-muted",
              )}
              title={theme.label}
            >
              {/* Swatch */}
              <div
                className="size-7 rounded-full border border-border/60 shadow-sm shrink-0"
                style={
                  theme.id === "default"
                    ? {
                        background:
                          "linear-gradient(135deg, hsl(var(--muted)) 50%, hsl(var(--background)) 50%)",
                      }
                    : theme.id === "dots"
                      ? {
                          backgroundImage:
                            "radial-gradient(circle, rgba(148,163,184,0.7) 1.5px, transparent 1.5px)",
                          backgroundSize: "7px 7px",
                        }
                      : theme.id === "grid"
                        ? {
                            backgroundImage:
                              "linear-gradient(rgba(100,116,139,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.5) 1px, transparent 1px)",
                            backgroundSize: "7px 7px",
                          }
                        : { backgroundColor: theme.color }
                }
              />
              <span className="text-[9px] leading-none text-muted-foreground truncate w-full text-center">
                {theme.label}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        {/* <div className="my-3 border-t border-border" /> */}

        {/* Custom image upload */} 
        {/* <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        /> */}

        {/* {isCustom && customImageUrl ? (
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-border shadow-sm">
              <img src={customImageUrl} alt="Custom background" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium truncate">Custom image</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-primary hover:underline text-left"
              >
                Change image
              </button>
            </div>
            <button
              onClick={() => { onImageRemove(); setOpen(false); }}
              className="size-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              aria-label="Remove custom image"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted transition-all"
          >
            <ImagePlus className="size-3.5" />
            Upload image
          </button>
        )} */}

        {uploadError && (
          <p className="mt-2 text-[10px] text-destructive text-center">{uploadError}</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border border-transparent transition-all",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          open && "bg-muted text-foreground",
        )}
        aria-label="Change chat theme"
      >
        {isCustom && customImageUrl ? (
          <span className="size-3 rounded-sm overflow-hidden border border-border/50 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={customImageUrl} alt="" className="w-full h-full object-cover" />
          </span>
        ) : current && current.id !== "default" ? (
          <span
            className="size-2.5 rounded-full border border-border/50 shrink-0"
            style={
              current.id === "dots" || current.id === "grid"
                ? { background: "repeating-linear-gradient(45deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 4px)" }
                : { backgroundColor: current.color }
            }
          />
        ) : null}
        <Palette className="size-3.5" />
        <span>Theme</span>
      </button>

      {mounted && open && createPortal(panel, document.body)}
    </>
  );
}
