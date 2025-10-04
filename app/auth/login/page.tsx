"use client"

import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { LoginForm } from "@/components/auth/login-form"
import { GL } from "@/components/gl"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <main className="relative min-h-svh flex items-center justify-center px-4">
      <GL hovering={false} />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard className="w-full">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-sentient">Welcome back</h1>
            <p className="font-mono text-sm text-foreground/60 mt-2">Please sign in to continue</p>
          </div>
          <LoginForm />
          <div className="mt-6 flex items-center justify-between text-sm font-mono">
            <Link className="text-primary hover:text-primary/80 transition-colors" href="/auth/signup">
              Don{"'"}t have an account? Signup
            </Link>
            <Button variant="default" size="sm" className="h-9" onClick={() => alert("A reset link would be sent.")}>
              Forgot password?
            </Button>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
