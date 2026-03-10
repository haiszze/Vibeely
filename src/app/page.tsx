import { Button } from "@/src/app/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold">Welcome to Vibeely</h1>
        <p className="text-xl text-muted-foreground">
          Connect with people with the same interests and university, and
          build meaningful friendships
        </p>

        <div className="flex gap-4 justify-center pt-6">
          <Link href="/interest">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}