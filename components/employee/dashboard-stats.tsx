"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

type DashboardData = {
  totalExpenses: number
  pendingExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  totalAmount: number
  currency: string
  recentExpenses: Array<{
    _id: string
    merchantName: string
    amount: number
    originalCurrency: string
    status: string
    date: string
  }>
}

export function DashboardStats() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchDashboard()
    }
  }, [session?.user?.email])

  async function fetchDashboard() {
    if (!session?.user?.email) return

    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/employee')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard')
      }

      const dashData = await response.json()
      setData(dashData)
    } catch (error: any) {
      toast({
        title: "Failed to load dashboard",
        description: error.message,
        variant: "destructive",
      })
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-foreground/60">Loading dashboard...</div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-sentient">Dashboard</h2>
        <p className="font-mono text-xs text-foreground/60">Your expense overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold">{data.totalExpenses}</div>
          <div className="text-xs text-foreground/60">Total Expenses</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold text-blue-600">{data.pendingExpenses}</div>
          <div className="text-xs text-foreground/60">Pending</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold text-green-600">{data.approvedExpenses}</div>
          <div className="text-xs text-foreground/60">Approved</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold text-red-600">{data.rejectedExpenses}</div>
          <div className="text-xs text-foreground/60">Rejected</div>
        </Card>
      </div>

      <Card className="p-4 bg-background/40 border-border/50">
        <div className="text-xs text-foreground/60 mb-1">Total Amount</div>
        <div className="text-3xl font-bold">
          {(data.totalAmount || 0).toFixed(2)} {data.currency || 'USD'}
        </div>
      </Card>

      {data.recentExpenses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Recent Expenses</h3>
          <div className="space-y-2">
            {data.recentExpenses.slice(0, 5).map((expense) => (
              <Card key={expense._id} className="p-3 bg-background/20 border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{expense.merchantName}</div>
                    <div className="text-xs text-foreground/60">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {expense.amount.toFixed(2)} {expense.originalCurrency}
                    </div>
                    <div className="text-xs text-foreground/60">{expense.status}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
