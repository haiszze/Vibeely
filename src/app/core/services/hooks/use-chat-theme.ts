import { useCallback, useState } from "react";

export interface ChatTheme {
  id: string;
  label: string;
  color: string;
  style: React.CSSProperties;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: "default",
    label: "Default",
    color: "transparent",
    style: {},
  },
  {
    id: "sunset",
    label: "Sunset",
    color: "#f97316",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(234,179,8,0.1) 50%, rgba(236,72,153,0.12) 100%)",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    color: "#0ea5e9",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(14,165,233,0.13) 0%, rgba(6,182,212,0.1) 50%, rgba(99,102,241,0.1) 100%)",
    },
  },
  {
    id: "forest",
    label: "Forest",
    color: "#22c55e",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(34,197,94,0.13) 0%, rgba(16,185,129,0.1) 50%, rgba(14,165,233,0.08) 100%)",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    color: "#6366f1",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.13) 50%, rgba(59,130,246,0.1) 100%)",
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    color: "#a855f7",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(168,85,247,0.13) 0%, rgba(236,72,153,0.1) 40%, rgba(99,102,241,0.13) 100%)",
    },
  },
  {
    id: "rose",
    label: "Rose",
    color: "#f43f5e",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(244,63,94,0.11) 0%, rgba(251,113,133,0.08) 50%, rgba(249,168,212,0.11) 100%)",
    },
  },
  {
    id: "sand",
    label: "Sand",
    color: "#d97706",
    style: {
      backgroundImage:
        "linear-gradient(135deg, rgba(217,119,6,0.11) 0%, rgba(245,158,11,0.08) 50%, rgba(234,179,8,0.11) 100%)",
    },
  },
  {
    id: "dots",
    label: "Dots",
    color: "#94a3b8",
    style: {
      backgroundImage:
        "radial-gradient(circle, rgba(148,163,184,0.3) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
  },
  {
    id: "grid",
    label: "Grid",
    color: "#64748b",
    style: {
      backgroundImage:
        "linear-gradient(rgba(100,116,139,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.18) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    },
  },
];

export function useChatTheme() {
  const [themeId, setThemeId] = useState<string>("default");
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
  }, []);

  const setCustomImage = useCallback((dataUrl: string | null) => {
    if (dataUrl === null) {
      setCustomImageUrl(null);
      setThemeId("default");
    } else {
      setCustomImageUrl(dataUrl);
      setThemeId("custom");
    }
  }, []);

  const theme: ChatTheme =
    themeId === "custom" && customImageUrl
      ? {
          id: "custom",
          label: "Custom",
          color: "transparent",
          style: {
            backgroundImage: `url(${customImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          },
        }
      : (CHAT_THEMES.find((t) => t.id === themeId) ?? CHAT_THEMES[0]);

  return { theme, setTheme, customImageUrl, setCustomImage, themes: CHAT_THEMES };
}
