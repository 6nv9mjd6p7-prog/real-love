"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.ComponentProps<"progress">) {
  return (
    <progress
      data-slot="progress"
      value={value}
      max={max}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full border-0 bg-primary/20 accent-primary",
        className
      )}
      {...props}
    />
  )
}

export { Progress }
