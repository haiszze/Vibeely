"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProp } from "../../core/model/userprop.model";
import {
  Cpu,
  Coffee,
  Palette,
  Music,
  Gamepad2,
  UtensilsCrossed,
  Plane,
  GraduationCap,
  Dumbbell,
  Camera,
  Film,
  BookOpen,
  Sparkles,
  Check,
  X,
  MessageCircleHeart,
  ChevronDown,
} from "lucide-react";

interface InterestSelectorProps {
  onInterestsSelect: (interestPageProps: UserProp) => void | Promise<void>;
  maxSelections?: number;
  className?: string;
  loading?: boolean;
}

interface MenuPosition {
  direction: "up" | "down";
  maxHeight: number;
}

const INTERESTS = [
  { id: "technology", label: "Technology", icon: <Cpu className="w-4 h-4" /> },
  { id: "coffee", label: "Coffee", icon: <Coffee className="w-4 h-4" /> },
  { id: "arts", label: "Arts", icon: <Palette className="w-4 h-4" /> },
  { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
  { id: "gaming", label: "Gaming", icon: <Gamepad2 className="w-4 h-4" /> },
  { id: "food", label: "Food", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "travel", label: "Travel", icon: <Plane className="w-4 h-4" /> },
  {
    id: "education",
    label: "Education",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  { id: "fitness", label: "Fitness", icon: <Dumbbell className="w-4 h-4" /> },
  {
    id: "photography",
    label: "Photography",
    icon: <Camera className="w-4 h-4" />,
  },
  { id: "movies", label: "Movies", icon: <Film className="w-4 h-4" /> },
  { id: "books", label: "Books", icon: <BookOpen className="w-4 h-4" /> },
];

export function InterestSelector({
  onInterestsSelect,
  maxSelections = 5,
  loading = false,
}: InterestSelectorProps) {
  // ✅ Fix 1: Initialize with empty/default values only
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerWrapperRef = useRef<HTMLDivElement>(null);

  // Where the menu should open and how tall it's allowed to be, computed from
  // real available screen space rather than a guessed CSS value.
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    direction: "down",
    maxHeight: 256, // 16rem default, matches previous max-h-64
  });

  // ✅ Fix 2: Load from sessionStorage only after client mount
  useEffect(() => {
    setIsClient(true);

    // Load name from sessionStorage
    const sessionRaw = window.sessionStorage.getItem("session");
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session.userProp?.name) {
          setName(session.userProp.name);
        }
        if (session.userProp?.interests) {
          setSelected(session.userProp.interests);
        }
      } catch (error) {
        console.error("Failed to parse session data", error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    function updateMenuPosition() {
      if (!triggerWrapperRef.current) return;
      const rect = triggerWrapperRef.current.getBoundingClientRect();
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const gap = 8;
      const edgePadding = 16;
      const preferredMax = 256;

      const spaceBelow = viewportHeight - rect.bottom - gap - edgePadding;
      const spaceAbove = rect.top - gap - edgePadding;

      // Prefer opening down; only flip up if down is cramped and up has more room.
      if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
        setMenuPosition({
          direction: "down",
          maxHeight: Math.max(100, Math.min(preferredMax, spaceBelow)),
        });
      } else {
        setMenuPosition({
          direction: "up",
          maxHeight: Math.max(100, Math.min(preferredMax, spaceAbove)),
        });
      }
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.visualViewport?.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.visualViewport?.removeEventListener("resize", updateMenuPosition);
    };
  }, [dropdownOpen]);

  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= maxSelections) return prev;
      return [...prev, id];
    });
  };

  const removeInterest = (id: string) => {
    setSelected((prev) => prev.filter((item) => item !== id));
  };

  const handleContinue = () => {
    onInterestsSelect?.({ name, interests: selected });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Name input */}
      <div>
        <label className="block text-foreground text-sm font-medium mb-3 uppercase tracking-wider">
          Name
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          className="glass-surface w-full px-5 py-3 border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all shadow-[0_0_0_0_rgba(var(--primary-rgb),0.5)] animate-pulse"
          onFocus={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 40px rgba(236, 72, 153, 0.3)";
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "var(--glass-border)";
          }}
        />
      </div>

      {/* Interests dropdown */}
      <div className="space-y-3" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <motion.label
            className="block text-foreground/80 text-sm font-medium uppercase tracking-wider"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            Pick your interests
          </motion.label>
          <span className="text-sm text-muted-foreground">
            {selected.length}/{maxSelections} selected
          </span>
        </div>

        {/* Selected chips */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              <AnimatePresence mode="popLayout">
                {selected.map((id) => {
                  const interest = INTERESTS.find((i) => i.id === id);
                  if (!interest) return null;
                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 bg-primary border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                    >
                      <span className="text-white">{interest.icon}</span>
                      <span className="text-white text-sm">
                        {interest.label}
                      </span>
                      <motion.button
                        onClick={() => removeInterest(id)}
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropdown trigger + menu wrapper (relative, so the menu can float).
            min-w-0 lets this shrink inside flex/grid parents instead of forcing overflow. */}
        <div className="relative min-w-0" ref={triggerWrapperRef}>
          <motion.button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`glass-surface glass-surface-hover w-full box-border px-5 py-3 border rounded-2xl text-muted-foreground text-left flex items-center justify-between transition-all ${
              dropdownOpen ? "border-primary" : "border-foreground/10"
            }`}
            style={{
              boxShadow: dropdownOpen
                ? "0 0 40px rgba(236, 72, 153, 0.3)"
                : "none",
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span>
              {selected.length === 0
                ? "Select your interests..."
                : `${selected.length} interest${selected.length > 1 ? "s" : ""} selected`}
            </span>
            <motion.div
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.button>

          {/* Dropdown menu — absolutely positioned so it floats OVER the Submit button
              instead of pushing it down, and flips upward automatically if there
              isn't enough room below it on screen. */}
          <AnimatePresence>
            {dropdownOpen && isClient && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: menuPosition.direction === "up" ? 10 : -10,
                  scale: 0.95,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: menuPosition.direction === "up" ? 10 : -10,
                  scale: 0.95,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`glass-surface-strong absolute left-0 w-full box-border overflow-y-auto overflow-x-hidden border rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.16)] z-50 ${
                  menuPosition.direction === "up"
                    ? "bottom-full mb-2"
                    : "top-full mt-2"
                }`}
                style={{
                  // Match the trigger's width exactly and never exceed the viewport,
                  // with a little breathing room (1rem) on each side.
                  maxWidth: "calc(100vw - 2rem)",
                  // Measured from real available space below/above the trigger,
                  // so it can never run off the top or bottom of the screen.
                  maxHeight: `${menuPosition.maxHeight}px`,
                }}
              >
                {INTERESTS.map((interest, index) => {
                  const isSelected = selected.includes(interest.id);
                  const isDisabled =
                    !isSelected && selected.length >= maxSelections;

                  return (
                    <motion.button
                      key={interest.id}
                      onClick={() => !isDisabled && toggleInterest(interest.id)}
                      className="w-full px-6 py-3 text-left flex items-center justify-between transition-all first:rounded-t-2xl last:rounded-b-2xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={!isDisabled ? { x: 4 } : {}}
                      disabled={isDisabled}
                      style={{
                        background: isSelected
                          ? "bg-[rgba(var(--primary-rgb),0.2)]"
                          : "bg-transparent",
                        opacity: isDisabled ? 0.4 : 1,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.span
                          className="text-foreground"
                          animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {interest.icon}
                        </motion.span>
                        <span className="text-foreground">{interest.label}</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                          }}
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-primary"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleContinue}
        disabled={loading || !name.trim() || selected.length === 0}
        className="w-full py-3 bg-secondary rounded-2xl text-white font-semibold text-lg shadow-[0_10px_15px_-3px_rgba(var(--primary-rgb),0.3)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? <span>Loading...</span> : <span>Vibee</span>}
      </motion.button>
    </div>
  );
}