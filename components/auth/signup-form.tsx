"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const COUNTRIES = [
  { code: "US", name: "United States (USD)" },
  { code: "GB", name: "United Kingdom (GBP)" },
  { code: "EU", name: "European Union (EUR)" },
  { code: "IN", name: "India (INR)" },
  { code: "JP", name: "Japan (JPY)" },
  { code: "CA", name: "Canada (CAD)" },
  { code: "AU", name: "Australia (AUD)" },
  { code: "CN", name: "China (CNY)" },
]

export function SignupForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    country: "US",
  })
  const [loading, setLoading] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (form.password !== form.confirm) {
      toast({ 
        title: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (form.password.length < 6) {
      toast({ 
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          countryCode: form.country,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      toast({
        title: "Account created!",
        description: "You can now log in with your credentials.",
      })

      // Redirect to login page
      router.push("/auth/login")
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4 mt-5" onSubmit={handleSubmit}>

      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Acme Corp"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@acme.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="country">Country</Label>
        <Select value={form.country} onValueChange={(v) => update("country", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      <div className="grid gap-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={(e) => update("confirm", e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full mt-6" disabled={loading}>
        {loading ? "Creating account..." : "Signup"}
      </Button>
    </form>
  )
}
