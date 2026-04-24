"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Sparkles } from "lucide-react"
import { InterestSelector } from "@/src/app/components/interest/interest-selector"
import { setSession } from "@/src/app/core/services/session/session"
import { logError } from "@/src/app/core/services/log/log"
import { UserProp } from "../app/core/model/userprop.model"

const PRIMARY = "#9333ea"
const SECONDARY = "#3b82f6"

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
      background: `${i % 2 === 0 ? PRIMARY : SECONDARY}0d`,
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

      {/* Gradient overlay using primary color */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom right, ${PRIMARY}18, transparent, ${SECONDARY}18)`,
        }}
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

        {/* Header - keep sparkles as they were */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <h1
              className="text-7xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${PRIMARY}, #ec4899, ${SECONDARY})`,
              }}
            >
              VIBEELY
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-lg"
          >
            Connect yourself with others
          </motion.p>
        </motion.div>

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