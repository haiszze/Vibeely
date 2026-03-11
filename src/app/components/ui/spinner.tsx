import { LoaderIcon } from "lucide-react"

import { cn } from "@/src/app/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-7 animate-spin", className)}
      {...props}
    />
  )
}

export function SpinnerCustom() {
  return (
    <Spinner/>
  )
}

export {
  Spinner
}
