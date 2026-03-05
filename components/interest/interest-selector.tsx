import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InterestSelectorProps {
  onInterestsSelect: (interestPageProps: UserProp) => void | Promise<void>
  maxSelections?: number
  className?: string
  loading?: boolean
}

const INTERESTS = [
  { id: 'technology', label: 'Technology' },
  { id: 'sports', label: 'Sports' },
  { id: 'arts', label: 'Arts & Design' },
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'food', label: 'Food' },
  { id: 'travel', label: 'Travel' },
  { id: 'education', label: 'Education' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'photography', label: 'Photography' },
  { id: 'movies', label: 'Movies & TV' },
  { id: 'books', label: 'Books & Literature' },
]

const UNIVERSITIES = [
  { id: 'up', label: 'University of the Philippines' },
  { id: 'ateneo', label: 'Ateneo de Manila University' },
  { id: 'dlsu', label: 'De La Salle University' },
  { id: 'ust', label: 'University of Santo Tomas' },
  { id: 'mapua', label: 'Mapúa University' },
  { id: 'pup', label: 'Polytechnic University of the Philippines' },
  { id: 'admu', label: 'Adamson University' },
]

export function InterestSelector({
  onInterestsSelect,
  maxSelections = 5,
  loading = false,
}: InterestSelectorProps) {
  const [selected, setSelected] = React.useState<string[]>([])
  const [selectedUniversity, setSelectedUniversity] = React.useState<string>('')
  const [name, setName] = React.useState<string>('')

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
    onInterestsSelect?.({
      name,
      interests: selected,
      university: selectedUniversity,
    })
  }

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
      <div className="flex justify-between">
        <Label>Interests</Label>
        <Label>
          {selected.length} / {maxSelections} interests selected
        </Label>
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id)
          return (
            <Button
              key={interest.id}
              onClick={() => handleToggle(interest.id)}
              variant={isSelected ? 'default' : 'outline'}
              className="rounded-full p-3 transition-all"
            >
              {interest.label}
            </Button>
          )
        })}
      </div>

      <Button
        className="min-w-30 self-end"
        onClick={handleContinue}
        disabled={loading || selected.length === 0 || !selectedUniversity}
        size="lg"
      >
        {loading ? 'Loading...' : 'Continue'}
      </Button>
    </div>
  )
}
