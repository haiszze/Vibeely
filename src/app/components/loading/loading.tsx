"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSession } from "../../core/services/session/session";
import { clearMatchTables } from "../../core/services/api/queue/queue-client";

interface LoadingPageProps {
  userName: string;
  interests: string[];
}

const STATUSES = [
  "Searching for vibes...",
  "Analyzing interests...",
  "Finding perfect match...",
  "Almost there...",
];

export function Loading({
  userName,
  interests = [],
}: LoadingPageProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  const router = useRouter();

  const handleBack = async () => {
    const session = getSession();
    if (session) {
      await clearMatchTables(session.sessionId, null);
    }
    router.push("/");
  };

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIndex((i) => (i + 2) % STATUSES.length);
    }, 1500);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background transition-colors duration-300">
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-primary-secondary"
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-10">
        {/* Spinner */}
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-40"
            style={{
              background: `linear-gradient(to right, var(--primary), var(--secondary))`,
            }}
          />
          {/* Spinning ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, var(--primary), var(--secondary), transparent)`,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))",
            }}
          />
          {/* Center icon */}
          <Sparkles className="w-8 h-8 text-primary relative z-10" />
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-semibold text-foreground"
          >
            {STATUSES[statusIndex]}
          </motion.p>
          <p className="text-muted-foreground text-sm">
            Finding someone who shares your vibe, {userName}
          </p>
        </div>

        {/* Interest chips */}
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          {interests.map((interest, index) => (
            <motion.div
              key={interest}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass-surface px-4 py-1.5 rounded-full text-sm text-muted-foreground border"
            >
              {interest}
            </motion.div>
          ))}
        </div>

        {/* Cancel button */}
        <motion.button
          onClick={handleBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-surface glass-surface-hover flex items-center gap-2 px-5 py-2.5 rounded-full border transition-colors text-sm text-muted-foreground"
        >
          <X className="w-4 h-4" />
          Cancel
        </motion.button>
      </div>
    </div>
  );
}
