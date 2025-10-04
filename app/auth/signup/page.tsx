"use client"

import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { SignupForm } from "@/components/auth/signup-form"
import { GL } from "@/components/gl"

export default function SignupPage() {
  return (
    <main className="relative min-h-svh flex items-center justify-center px-4">
      <GL hovering={false} />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-sentient">Create company account</h1>
            <p className="font-mono text-sm text-foreground/60 mt-2">Set up your organization in minutes</p>
          </div>
          <SignupForm />
          <div className="mt-6 text-sm font-mono text-right">
            <Link className="text-primary hover:text-primary/80 transition-colors" href="/auth/login">
              Already have an account? Sign in
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
