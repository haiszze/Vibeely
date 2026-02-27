"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { InterestSelector } from "@/components/interest/interest-selector"

export default function InterestPage() {
  const router = useRouter()

  const handleInterestsSelect = (interests: string[]) => {
    localStorage.setItem("userInterests", JSON.stringify(interests))
    router.push("/chat")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <InterestSelector onInterestsSelect={handleInterestsSelect} />
      </div>
    </div>
  )
}
