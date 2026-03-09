"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { InterestSelector } from "@/src/app/components/interest/interest-selector"
import { setSession } from "@/src/app/core/services/session/session"
import { logError } from "@/src/app/core/services/log/log"
import { UserProp } from "../../core/model/userprop.model"

export default function InterestPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleInterestsSelect = async (userProp: UserProp) => {
    setLoading(true)
    try {
      const { name, interests, university } = userProp

      setSession({ name, interests, university })

      router.push("/chat")

    } catch (error) {
      logError("profile: failed to save", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl min-h-screen bg-background flex items-center justify-center p-4">
        <InterestSelector onInterestsSelect={handleInterestsSelect} loading={loading} />
    </div>
  )
}