import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InterestSelectorProps {
  onInterestsSelect: (name: string, interests: string[], university: string) => void | Promise<void>
  maxSelections?: number
  className?: string
  loading?: boolean
}

const INTERESTS = [
  { id: "technology", label: "Technology" },
  { id: "sports", label: "Sports" },
  { id: "arts", label: "Arts & Design" },
  { id: "music", label: "Music" },
  { id: "gaming", label: "Gaming" },
  { id: "food", label: "Food & Cooking" },
  { id: "travel", label: "Travel" },
  { id: "education", label: "Education" },
  { id: "fitness", label: "Fitness" },
  { id: "photography", label: "Photography" },
  { id: "movies", label: "Movies & TV" },
  { id: "books", label: "Books & Literature" },
]

const UNIVERSITIES = [
  { id: "up", label: "University of the Philippines" },
  { id: "ateneo", label: "Ateneo de Manila University" },
  { id: "dlsu", label: "De La Salle University" },
  { id: "ust", label: "University of Santo Tomas" },
  { id: "mapua", label: "Mapúa University" },
  { id: "pup", label: "Polytechnic University of the Philippines" },
  { id: "admu", label: "Adamson University" },
]

export function InterestSelector({
  onInterestsSelect,
  maxSelections = 5,
  className,
  loading = false,
}: InterestSelectorProps) {
  const [selected, setSelected] = React.useState<string[]>([])
  const [selectedUniversity, setSelectedUniversity] = React.useState<string>("")
  const [name, setName] = React.useState<string>("")

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        if (prev.length >= maxSelections) {
          return prev
        }
        return [...prev, id]
      }
    })
  }

  const handleContinue = () => {
    onInterestsSelect?.(name, selected, selectedUniversity)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Name Input */}
      <div className="flex flex-col items-center text-center gap-2">
        <h1 className="text-3xl font-bold">Name</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full max-w-md mx-auto border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* University Selection */}
      <div className="flex flex-col gap-3">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Select Your University & Interests</h1>
        </div>

        <p className="text-lg font-semibold">Select Your University</p>
        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
          <SelectTrigger className="w-full max-w-md mx-auto">
            <SelectValue placeholder="Choose your university..." />
          </SelectTrigger>
          <SelectContent>
            {UNIVERSITIES.map((uni) => (
              <SelectItem key={uni.id} value={uni.id}>
                {uni.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interests Selection */}
      <div className="flex flex-col gap-3">
        <p className="text-lg font-semibold">Select Your Interests</p>
        <p className="text-sm text-muted-foreground">
          Choose up to {maxSelections} topics you&apos;d like to explore
        </p>
        <div className="flex flex-wrap gap-1 justify-center">
          {INTERESTS.map((interest) => {
            const isSelected = selected.includes(interest.id)
            return (
              <Button
                key={interest.id}
                onClick={() => handleToggle(interest.id)}
                variant={isSelected ? "default" : "outline"}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              >
                {interest.label}
              </Button>
            )
          })}
        </div>
      </div>

    <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {selected.length} / {maxSelections} interests selected
        </p>
        <Button
          onClick={handleContinue}
          disabled={loading || selected.length === 0 || !selectedUniversity}
          size="lg"
        >
          {loading ? "Loading..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}