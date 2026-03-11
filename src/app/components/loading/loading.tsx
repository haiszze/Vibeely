'use client'

import { Spinner } from "@/src/app/components/ui/spinner";
import { Button } from "../ui/button";
import { Locate } from "lucide-react";
import { useRouter } from "next/navigation";

export function Loading() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <Spinner />
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-md font-medium">Finding a match...</h2>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="p-3"
          onClick={() => router.push("/interest")}
        >
          Back
        </Button>
      </div>
    </div>
  );
}