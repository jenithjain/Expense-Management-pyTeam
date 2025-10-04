"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { GlassCard } from "@/components/shared/glass-card"

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Lodging",
  "Office Supplies",
  "Travel",
  "Entertainment",
  "Other"
] as const

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CNY"] as const

export function ExpenseForm() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [form, setForm] = useState({
    merchantName: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    category: "Food & Dining",
    amount: "",
    currency: "USD",
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [autoScan, setAutoScan] = useState(true)

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleReceiptUpload(file: File) {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setReceiptUrl(data.url)
      setReceiptFile(file)

      toast({
        title: "Receipt uploaded",
        description: autoScan ? "Auto-scanning receipt..." : "Click 'Scan Receipt' to extract data",
      })

      // Auto-scan if enabled
      if (autoScan) {
        // Small delay to ensure upload is complete
        setTimeout(() => {
          handleScanReceipt(data.url)
        }, 500)
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleScanReceipt(urlOverride?: string) {
    const urlToScan = urlOverride || receiptUrl
    
    if (!urlToScan) {
      toast({
        title: "No receipt",
        description: "Please upload a receipt first",
        variant: "destructive",
      })
      return
    }

    setScanning(true)
    try {
      const response = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: urlToScan }),
      })

      if (!response.ok) {
        throw new Error('Scan failed')
      }

      const { data } = await response.json()

      // Pre-fill form with OCR data
      setForm({
        merchantName: data.merchantName || form.merchantName,
        description: data.description || form.description,
        date: data.date || form.date,
        category: data.category || form.category,
        amount: data.amount?.toString() || form.amount,
        currency: data.originalCurrency || form.currency,
      })

      toast({
        title: "Receipt scanned! 🎉",
        description: "Form auto-filled. Please review and confirm the data.",
      })
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!session) {
      toast({
        title: "Not authenticated",
        description: "Please log in to submit expenses",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/expenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantName: form.merchantName,
          description: form.description,
          date: form.date,
          category: form.category,
          amount: parseFloat(form.amount),
          originalCurrency: form.currency,
          receiptUrl: receiptUrl || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create expense')
      }

      const data = await response.json()

      toast({
        title: "Expense submitted!",
        description: `Your expense of ${form.currency} ${form.amount} has been submitted for approval.`,
      })

      // Reset form
      setForm({
        merchantName: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        category: "Food & Dining",
        amount: "",
        currency: "USD",
      })
      setReceiptFile(null)
      setReceiptUrl("")
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <h2 className="text-xl font-sentient">Submit Expense</h2>
        <p className="font-mono text-xs text-foreground/60">Attach receipt and provide details</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Attach Receipt</Label>
            <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={autoScan}
                onChange={(e) => setAutoScan(e.target.checked)}
                className="rounded border-border"
              />
              Auto-scan on upload
            </label>
          </div>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleReceiptUpload(file)
              }}
              disabled={loading || scanning}
            />
            {receiptUrl && !autoScan && (
              <Button
                type="button"
                onClick={() => handleScanReceipt()}
                disabled={scanning}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                {scanning ? "Scanning..." : "Scan Receipt"}
              </Button>
            )}
          </div>
          {receiptFile && (
            <p className="text-xs font-mono text-foreground/60">
              Attached: {receiptFile.name}
            </p>
          )}
          {scanning && (
            <p className="text-xs font-mono text-foreground/60 animate-pulse">
              🤖 AI is analyzing your receipt...
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="merchant">Merchant Name</Label>
            <Input
              id="merchant"
              placeholder="Restaurant, Store, etc."
              value={form.merchantName}
              onChange={(e) => update("merchantName", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Expense Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={form.date} 
              onChange={(e) => update("date", e.target.value)} 
              required 
            />
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Additional details about the expense"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="mt-2 w-full md:w-fit"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Expense"}
        </Button>
      </div>
    </form>
  )
}
