"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Users, TrendingUp, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"

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
  teamStatistics?: {
    teamMemberCount: number
    totalTeamExpenses: number
    pendingTeamExpenses: number
    approvedTeamExpenses: number
    totalTeamSpending: number
  }
  teamSpendingByCategory?: Array<{
    category: string
    total: number
    count: number
  }>
  teamMembers?: Array<{
    id: string
    name: string
    email: string
    role: string
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
      console.log('Manager dashboard data:', dashData)
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-sentient">Manager Dashboard</h2>
        <p className="text-sm text-foreground/60">Your approval overview and team insights</p>
      </div>

      {/* Approval Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Approval Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div className="text-xs text-foreground/60">Pending</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{data.pendingApprovals}</div>
          </Card>
          
          <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div className="text-xs text-foreground/60">Approved (Month)</div>
            </div>
            <div className="text-2xl font-bold text-green-600">{data.approvedThisMonth}</div>
          </Card>
          
          <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div className="text-xs text-foreground/60">Rejected (Month)</div>
            </div>
            <div className="text-2xl font-bold text-red-600">{data.rejectedThisMonth}</div>
          </Card>

          <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <div className="text-xs text-foreground/60">Total Approved</div>
            </div>
            <div className="text-2xl font-bold text-green-500">{data.totalApproved}</div>
          </Card>

          <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <div className="text-xs text-foreground/60">Total Rejected</div>
            </div>
            <div className="text-2xl font-bold text-red-500">{data.totalRejected}</div>
          </Card>
        </div>
      </div>

      {/* Pending Amount */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-6 h-6 text-blue-500" />
          <div className="text-sm text-foreground/60">Total Pending Amount</div>
        </div>
        <div className="text-4xl font-bold">
          {(data.pendingAmount || 0).toFixed(2)} {data.currency || 'USD'}
        </div>
      </Card>

      {/* Team Statistics */}
      {data.teamStatistics && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <div className="text-xs text-foreground/60">Team Members</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {data.teamStatistics.teamMemberCount}
              </div>
            </Card>

            <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <div className="text-xs text-foreground/60">Total Expenses</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {data.teamStatistics.totalTeamExpenses}
              </div>
            </Card>

            <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div className="text-xs text-foreground/60">Pending</div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {data.teamStatistics.pendingTeamExpenses}
              </div>
            </Card>

            <Card className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="text-xs text-foreground/60">Approved</div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {data.teamStatistics.approvedTeamExpenses}
              </div>
            </Card>
          </div>

          {/* Total Team Spending */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-border/50 mt-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              <div className="text-sm text-foreground/60">Total Team Spending (Approved)</div>
            </div>
            <div className="text-4xl font-bold">
              {(data.teamStatistics.totalTeamSpending || 0).toFixed(2)} {data.currency || 'USD'}
            </div>
          </Card>
        </div>
      )}

      {/* Team Spending by Category */}
      {data.teamSpendingByCategory && data.teamSpendingByCategory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Team Spending by Category</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.teamSpendingByCategory.map((cat) => (
              <Card key={cat.category} className="p-4 bg-background/40 border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium">{cat.category}</div>
                  <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                    {cat.count} {cat.count === 1 ? 'expense' : 'expenses'}
                  </div>
                </div>
                <div className="text-xl font-bold">
                  {cat.total.toFixed(2)} {data.currency}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {data.teamMembers && data.teamMembers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Team</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.teamMembers.map((member) => (
              <Card key={member.id} className="p-4 bg-background/40 border-border/50 hover:bg-background/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-foreground/60">{member.email}</div>
                    <div className="text-xs text-blue-400 capitalize">{member.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Approvals */}
      {data.recentApprovals && data.recentApprovals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Approval Activity</h3>
          <div className="space-y-2">
            {data.recentApprovals.slice(0, 5).map((approval) => (
              <Card key={approval._id} className="p-4 bg-background/20 border-border/40 hover:bg-background/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{approval.expense.merchantName}</div>
                    <div className="text-xs text-foreground/60">
                      By: {approval.expense.employee.name}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold">
                      {approval.expense.amount.toFixed(2)} {approval.expense.originalCurrency}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded ${
                      approval.status === 'Approved' || approval.status === 'APPROVED'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {approval.status}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Team Message */}
      {data.teamStatistics?.teamMemberCount === 0 && (
        <Card className="p-6 bg-background/20 border-border/40 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
          <div className="text-lg font-medium mb-2">No Team Members Yet</div>
          <div className="text-sm text-foreground/60">
            Ask your admin to assign employees to you as their manager.
          </div>
        </Card>
      )}
    </div>
  )
}
