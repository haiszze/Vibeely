'use client'

import React, { useState } from "react";
import { Button } from "@/src/app/components/ui/button";
import { Input } from "@/src/app/components/ui/input";
import { Label } from "@/src/app/components/ui/label";
import { UserProp } from "../../core/model/userprop.model";
import { 
  Cpu, 
  Coffee, 
  Palette,
  Music,
  Gamepad,
  MessageCircleHeart,
  Hamburger,
  Luggage,
  GraduationCap,
  Dumbbell,
  Camera,
  Popcorn,
  Album
} from "lucide-react";


interface InterestSelectorProps {
  onInterestsSelect: (interestPageProps: UserProp) => void | Promise<void>;
  maxSelections?: number;
  className?: string;
  loading?: boolean;
}

const INTERESTS = [
  { id: "technology", label: "Technology", icon:Cpu},
  { id: "coffee", label: "Coffee", icon:Coffee},
  { id: "arts", label: "Arts", icon:Palette },
  { id: "music", label: "Music", icon:Music },
  { id: "gaming", label: "Gaming", icon:Gamepad },
  { id: "food", label: "Food", icon:Hamburger },
  { id: "travel", label: "Travel", icon:Luggage },
  { id: "education", label: "Education", icon:GraduationCap},
  { id: "fitness", label: "Fitness", icon:Dumbbell },
  { id: "photography", label: "Photography", icon:Camera },
  { id: "movies", label: "Movies", icon:Popcorn },
  { id: "books", label: "Books", icon:Album },
];

function setInitialSelectedInterests(): string[] {
  if (typeof window === "undefined") return [];
  const sessionRaw = window.sessionStorage.getItem("session");
  if (!sessionRaw) return [];
  return sessionRaw ? JSON.parse(sessionRaw).userProp?.interests : [];
}

function setInitialName(): string {
  if (typeof window === "undefined") return "";
  const sessionRaw = window.sessionStorage.getItem("session");
  if (!sessionRaw) return "";
  return sessionRaw ? JSON.parse(sessionRaw).userProp?.name : "";
}

export function InterestSelector({
  onInterestsSelect,
  maxSelections = 5,
  loading = false,
}: InterestSelectorProps) {
  const [selected, setSelected] = useState<string[]>(() => setInitialSelectedInterests());
  const [name, setName] = useState<string>(() => setInitialName());

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= maxSelections) {
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleContinue = () => {
    onInterestsSelect?.({
      name,
      interests: selected,
    });
  };

  return (
    <div className="flex flex-col gap-7">
      
      <div className="flex flex-col mb-10 justify-center items-center gap-2">
        <Label className="text-6xl font-bold">VIBEELY</Label>
        <Label className="text-center text-muted-foreground">Connect yourself with others</Label>
      </div>

      {/* Name Input */}
      <div className="flex flex-col items-start justify-center text-center gap-2">
        <Label className="min-w-15 text-sm">NAME</Label>
        <Input
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Enter your name"
          className="w-full h-13 rounded-3xl"
        />
      </div>

      {/* Interests Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Label className="text-sm">INTEREST</Label>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 ">
          {INTERESTS.map((interest) => {
            const isSelected = selected.includes(interest.id);

            return (
              <Button
                key={interest.id}
                onClick={() => handleToggle(interest.id)}
                variant={isSelected ? "default" : "outline"}
                className="flex flex-col items-start justify-center gap-4 p-4 rounded-3xl h-25 w-35 transition-all"
              >
                <interest.icon  
                  className="w-7 h-7 md:w-5 md:h-5"
                  strokeWidth={2}
                />
                <Label className="min-w-15">{interest.label}</Label>
              </Button>
            );
          })}
        </div>
      </div>

      <Button
        className="min-w-30 h-15 rounded-3xl w-full md:w-auto md:self-center"
        onClick={handleContinue}
        disabled={loading || !name.trim() || selected.length === 0}
      >
        <Label className="min-w-15 text-md px-3 justify-center">
          {loading ? "LOADING..." : "VIBEE"}
          <MessageCircleHeart size={20} strokeWidth={2}/>
        </Label>
      </Button>
    </div>
  );
}
