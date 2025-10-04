"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { GlassCard } from "@/components/shared/glass-card"

const CATEGORIES = ["Meals", "Transport", "Lodging", "Office", "Misc"] as const
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY"] as const

export function ExpenseForm() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    description: "",
    date: "",
    category: "Meals",
    amount: "",
    currency: "USD",
    remarks: "",
    fileName: "",
  })

  const [meta, setMeta] = useState({
    approver: "Bob Smith",
    status: "Draft",
    time: "—",
  })

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-sentient">Submit Expense</h2>
        <p className="font-mono text-xs text-foreground/60">Attach receipt and provide details</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Attach Receipt</Label>
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              update("fileName", file ? file.name : "")
            }}
          />
          {form.fileName ? <p className="text-xs font-mono text-foreground/60">Attached: {form.fileName}</p> : null}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Describe the expense"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Expense Date</Label>
            <Input id="date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Total amount</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                required
              />
              <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="remarks">Description</Label>
          <Textarea
            id="remarks"
            placeholder="Additional details"
            value={form.remarks}
            onChange={(e) => update("remarks", e.target.value)}
          />
        </div>

        <GlassCard className="bg-background/20 border-border/40">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-mono text-foreground/60">Approver</div>
              <div className="text-sm">{meta.approver}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-foreground/60">Status</div>
              <div className="text-sm">{meta.status}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-foreground/60">Time</div>
              <div className="text-sm">{meta.time}</div>
            </div>
          </div>
        </GlassCard>

        <Button
          className="mt-2 w-full md:w-fit"
          onClick={() => {
            setMeta({ approver: "Bob Smith", status: "Submitted", time: new Date().toLocaleString() })
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}
