"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { InterestSelector } from "@/components/interest/interest-selector"

export default function InterestPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleInterestsSelect = async (name: string, interests: string[], university: string) => {
    setLoading(true)
    try {
      
      localStorage.setItem("userInterests", JSON.stringify(interests))
      localStorage.setItem("userName", name)
      localStorage.setItem("userUniversity", university)

      router.push("/chat")

    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <InterestSelector onInterestsSelect={handleInterestsSelect} loading={loading} />
      </div>
    </div>
  )
}