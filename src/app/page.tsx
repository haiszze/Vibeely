"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { InterestSelector } from "@/src/app/components/interest/interest-selector"
import { ThemeToggle } from "@/src/app/components/theme/theme-toggle"
import { setSession } from "@/src/app/core/services/session/session"
import { logError } from "@/src/app/core/services/log/log"
import { UserProp } from "../app/core/model/userprop.model"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [orbs, setOrbs] = React.useState<Array<{
    width: number;
    height: number;
    left: string;
    top: string;
    background: string;
    animateX: number;
    animateY: number;
    duration: number;
  }>>([])

  // Generate orbs only on the client after mount
  React.useEffect(() => {
    const generatedOrbs = [...Array(20)].map((_, i) => ({
      width: Math.random() * 300 + 50,
      height: Math.random() * 300 + 50,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      background: i % 2 === 0 
      ? `rgba(var(--primary-rgb), 0.05)` 
      : `rgba(var(--secondary-rgb), 0.05)`,
      animateX: Math.random() * 100 - 50,
      animateY: Math.random() * 100 - 50,
      duration: Math.random() * 10 + 10,
    }))
    setOrbs(generatedOrbs)
  }, [])

  const handleInterestsSelect = async (userProp: UserProp) => {
    setLoading(true)
    try {
      const { name, interests } = userProp
      setSession({ name, interests })
      router.push("/chat")
    } catch (error) {
      logError("profile: failed to save", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Gradient overlay using primary color */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-primary-secondary"
      />

      {/* Floating orbs */}
      {orbs.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {orbs.map((orb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: orb.width,
                height: orb.height,
                left: orb.left,
                top: orb.top,
                background: orb.background,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4],
                x: [0, orb.animateX, 0],
                y: [0, orb.animateY, 0],
              }}
              transition={{
                duration: orb.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen md:w-3/4 lg:w-1/3 m-auto flex flex-col items-center justify-center px-6 py-12">
          <h1
            className="text-9xl font-bold bg-clip-text text-secondary lobster-regular"
          >
            Vibeely  
          </h1>
          <span className="pt-4 text-md pb-10">
            Connect yourself with others
          </span>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <InterestSelector onInterestsSelect={handleInterestsSelect} loading={loading} />
        </motion.div>
      </div>
    </div>
  )
}