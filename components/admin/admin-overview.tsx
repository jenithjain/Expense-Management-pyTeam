"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Users, FileText, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"

type OverviewStats = {
  totalUsers: number
  totalEmployees: number
  totalManagers: number
  totalExpenses: number
  pendingExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  totalAmount: number
  currency: string
  monthlyStats: {
    currentMonth: number
    previousMonth: number
    percentageChange: number
  }
}

export function AdminOverview() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchStats()
    }
  }, [session?.user?.email])

  async function fetchStats() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/overview')
      
      if (!response.ok) {
        throw new Error('Failed to fetch overview')
      }

      const data = await response.json()
      setStats(data)
    } catch (error: any) {
      toast({
        title: "Failed to load overview",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-foreground/60">Loading overview...</div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtext: `${stats.totalEmployees} employees, ${stats.totalManagers} managers`,
      icon: <Users className="w-8 h-8 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Total Expenses",
      value: stats.totalExpenses,
      subtext: "All time",
      icon: <FileText className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-500/10",
    },
    {
      title: "Pending Approval",
      value: stats.pendingExpenses,
      subtext: "Awaiting review",
      icon: <Clock className="w-8 h-8 text-yellow-500" />,
      color: "bg-yellow-500/10",
    },
    {
      title: "Approved",
      value: stats.approvedExpenses,
      subtext: "Completed",
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      color: "bg-green-500/10",
    },
    {
      title: "Rejected",
      value: stats.rejectedExpenses,
      subtext: "Declined",
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      color: "bg-red-500/10",
    },
    {
      title: "Total Amount",
      value: `${stats.totalAmount.toFixed(2)} ${stats.currency}`,
      subtext: "Approved expenses",
      icon: <DollarSign className="w-8 h-8 text-emerald-500" />,
      color: "bg-emerald-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sentient mb-1">Dashboard Overview</h2>
        <p className="text-sm text-foreground/60">Company-wide expense management statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="p-6 bg-background/40 border-border/50 hover:border-primary/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-foreground/60 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-foreground/50">{stat.subtext}</p>
              </div>
              <div className={cn("p-3 rounded-lg", stat.color)}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stats.monthlyStats && (
        <Card className="p-6 bg-background/40 border-border/50">
          <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-foreground/60">Current Month</p>
              <p className="text-2xl font-bold">
                {stats.monthlyStats.currentMonth.toFixed(2)} {stats.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/60">Previous Month</p>
              <p className="text-2xl font-bold">
                {stats.monthlyStats.previousMonth.toFixed(2)} {stats.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/60">Change</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  stats.monthlyStats.percentageChange > 0
                    ? "text-green-500"
                    : stats.monthlyStats.percentageChange < 0
                    ? "text-red-500"
                    : ""
                )}
              >
                {stats.monthlyStats.percentageChange > 0 ? "+" : ""}
                {stats.monthlyStats.percentageChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
