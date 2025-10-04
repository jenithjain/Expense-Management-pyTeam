"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

type DashboardData = {
  pendingApprovals: number
  approvedThisMonth: number
  rejectedThisMonth: number
  totalApproved: number
  totalRejected: number
  pendingAmount: number
  currency: string
  recentApprovals: Array<{
    _id: string
    expense: {
      merchantName: string
      amount: number
      originalCurrency: string
      employee: {
        name: string
      }
    }
    status: string
    createdAt: string
  }>
}

export function ManagerDashboardStats() {
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
      const response = await fetch('/api/dashboard/manager')
      
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
        <h2 className="text-xl font-sentient">Manager Dashboard</h2>
        <p className="font-mono text-xs text-foreground/60">Your approval overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold text-blue-600">{data.pendingApprovals}</div>
          <div className="text-xs text-foreground/60">Pending Approvals</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold text-green-600">{data.approvedThisMonth}</div>
          <div className="text-xs text-foreground/60">Approved This Month</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="text-2xl font-bold text-red-600">{data.rejectedThisMonth}</div>
          <div className="text-xs text-foreground/60">Rejected This Month</div>
        </Card>
      </div>

      <Card className="p-4 bg-background/40 border-border/50">
        <div className="text-xs text-foreground/60 mb-1">Pending Amount</div>
        <div className="text-3xl font-bold">
          {(data.pendingAmount || 0).toFixed(2)} {data.currency || 'USD'}
        </div>
      </Card>

      {data.recentApprovals && data.recentApprovals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Recent Approvals</h3>
          <div className="space-y-2">
            {data.recentApprovals.slice(0, 5).map((approval) => (
              <Card key={approval._id} className="p-3 bg-background/20 border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{approval.expense.merchantName}</div>
                    <div className="text-xs text-foreground/60">
                      By: {approval.expense.employee.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {approval.expense.amount.toFixed(2)} {approval.expense.originalCurrency}
                    </div>
                    <div className="text-xs text-foreground/60">{approval.status}</div>
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
