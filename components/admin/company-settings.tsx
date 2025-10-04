"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Building2, Globe, DollarSign } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Company = {
  _id: string
  name: string
  defaultCurrency: string
  country: string
}

type Currency = {
  code: string
  name: string
  symbol: string
}

export function CompanySettings() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [company, setCompany] = useState<Company | null>(null)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    defaultCurrency: "",
    country: "",
  })

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchCompany()
      fetchCurrencies()
    }
  }, [session?.user?.companyId])

  async function fetchCompany() {
    try {
      const response = await fetch('/api/company/details')
      
      if (!response.ok) {
        throw new Error('Failed to fetch company')
      }

      const data = await response.json()
      setCompany(data)
      setFormData({
        name: data.name || "",
        defaultCurrency: data.defaultCurrency || "USD",
        country: data.country || "",
      })
    } catch (error: any) {
      toast({
        title: "Failed to load company",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchCurrencies() {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      const countries = await response.json()
      
      const currencySet = new Set<string>()
      const currencyList: Currency[] = []
      
      countries.forEach((country: any) => {
        if (country.currencies) {
          Object.entries(country.currencies).forEach(([code, data]: [string, any]) => {
            if (!currencySet.has(code)) {
              currencySet.add(code)
              currencyList.push({
                code,
                name: data.name,
                symbol: data.symbol || code,
              })
            }
          })
        }
      })
      
      setCurrencies(currencyList.sort((a, b) => a.code.localeCompare(b.code)))
    } catch (error) {
      console.error('Failed to fetch currencies:', error)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/company/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update company')
      }

      toast({
        title: "Company updated",
        description: "Settings have been saved successfully",
      })

      fetchCompany()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-foreground/60">Loading company settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sentient mb-1">Company Settings</h2>
        <p className="text-sm text-foreground/60">Manage your company information and preferences</p>
      </div>

      <Card className="p-6 bg-background/40 border-border/50">
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Country
              </Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Default Currency
              </Label>
              <Select
                value={formData.defaultCurrency}
                onValueChange={(value) => setFormData({ ...formData, defaultCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground/60">
                All expenses will be converted to this currency for reporting
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>

      {company && (
        <Card className="p-6 bg-background/40 border-border/50">
          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-foreground/60">Company ID</dt>
              <dd className="text-sm font-mono">{company._id}</dd>
            </div>
            <div>
              <dt className="text-sm text-foreground/60">Current Currency</dt>
              <dd className="text-sm font-semibold">{company.defaultCurrency}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  )
}
