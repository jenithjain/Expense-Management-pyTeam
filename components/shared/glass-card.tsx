"use client"

import type React from "react"

import { cn } from "@/lib/utils"

export function GlassCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-background/30 backdrop-blur-md shadow-[0_0_24px_-8px_rgba(255,255,255,0.2)]",
        "px-6 py-6 md:px-8 md:py-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
