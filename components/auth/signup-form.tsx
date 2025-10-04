"use client"

import { useState } from "react"
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
]

export function SignupForm() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    country: "US",
  })

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (form.password !== form.confirm) {
          toast({ title: "Passwords do not match" })
          return
        }
        toast({
          title: "Account created",
          description: "Demo signup complete. Proceed to login.",
        })
      }}
    >
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
      <Button type="submit" className="w-full mt-6">
        Signup
      </Button>
    </form>
  )
}
