'use client'

import { Spinner } from "@/src/app/components/ui/spinner";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { getSession } from "../../core/services/session/session";
import { clearMatchTables } from "../../core/services/api/queue/queue-client";

export function Loading() {
  const router = useRouter();

  const handleBack = async () => {
    const session = getSession();
    if (session) {
      await clearMatchTables(session.sessionId, null);
    }
    router.push("/");
  }

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
          onClick={handleBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
