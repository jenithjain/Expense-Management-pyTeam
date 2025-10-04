"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const { toast } = useToast()
  const [form, setForm] = useState({ email: "", password: "" })

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        toast({
          title: "Signed in",
          description: "This is a demo login. No server configured.",
        })
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full mt-6">
        Login
      </Button>
    </form>
  )
}
