'use client'

import React, { useEffect, useState } from "react";
import { Button } from "@/src/app/components/ui/button";
import { Input } from "@/src/app/components/ui/input";
import { Label } from "@/src/app/components/ui/label";
import { UserProp, University } from "../../core/model/userprop.model";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/app/components/ui/select";
import { getUniversities } from "../../core/services/api/university/university";

interface InterestSelectorProps {
  onInterestsSelect: (interestPageProps: UserProp) => void | Promise<void>;
  maxSelections?: number;
  className?: string;
  loading?: boolean;
}

const INTERESTS = [
  { id: "technology", label: "Technology" },
  { id: "sports", label: "Sports" },
  { id: "arts", label: "Arts & Design" },
  { id: "music", label: "Music" },
  { id: "gaming", label: "Gaming" },
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "education", label: "Education" },
  { id: "fitness", label: "Fitness" },
  { id: "photography", label: "Photography" },
  { id: "movies", label: "Movies & TV" },
  { id: "books", label: "Books & Literature" },
];

export function InterestSelector({
  onInterestsSelect,
  maxSelections = 5,
  loading = false,
}: InterestSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionRaw = window.sessionStorage.getItem("session");
      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw);
          setSelected(session.userProp?.interests || []);
          setSelectedUniversity(session.userProp?.university || "");
          setName(session.userProp?.name || "");
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await getUniversities();
      setUniversities(data);
    };
    load();
  }, []);

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
      university: selectedUniversity,
    });
  };

  return (
    <div className="flex flex-col gap-5 *:max-w-lg">
      {/* Name Input */}
      <div className="flex items-center text-center gap-2">
        <Label className="min-w-15">Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Enter your name"
          className="w-full"
        />
      </div>

      {/* University Selection */}
      <div className="flex items-center gap-2">
        <Label className="min-w-15">University</Label>
        <Select
          value={selectedUniversity}
          onValueChange={setSelectedUniversity}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose your university..." />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {universities.map((uni) => (
              <SelectItem key={uni.key} value={uni.key}>
                {uni.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interests Selection */}
      <div className="flex justify-between">
        <Label>Interests</Label>
        <Label>
          {selected.length} / {maxSelections} interests selected
        </Label>
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);
          return (
            <Button
              key={interest.id}
              onClick={() => handleToggle(interest.id)}
              variant={isSelected ? "default" : "outline"}
              className="rounded-full p-3 transition-all"
            >
              {interest.label}
            </Button>
          );
        })}
      </div>

      <Button
        className="min-w-30 self-end"
        onClick={handleContinue}
        disabled={loading || selected.length === 0 || !selectedUniversity}
        size="lg"
      >
        {loading ? "Loading..." : "Continue"}
      </Button>
    </div>
  );
}
