"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type ApprovalRequest = {
  _id: string
  expense: {
    _id: string
    merchantName: string
    description: string
    date: string
    category: string
    amount: number
    originalCurrency: string
    convertedAmount: number
    companyDefaultCurrency: string
    receiptUrl?: string
    employee: {
      name: string
      email: string
    }
  }
  status: "Pending" | "Approved" | "Rejected"
  comments?: string
}

export function ApprovalsTable() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [comments, setComments] = useState("")

  useEffect(() => {
    if (session?.user?.email) {
      fetchApprovals()
    }
  }, [session?.user?.email])

  async function fetchApprovals() {
    if (!session?.user?.email) return

    setLoading(true)
    try {
      const response = await fetch('/api/approvals/pending')
      
      if (!response.ok) {
        throw new Error('Failed to fetch approvals')
      }

      const data = await response.json()
      setApprovals(data.approvalRequests || [])
    } catch (error: any) {
      toast({
        title: "Failed to load approvals",
        description: error.message,
        variant: "destructive",
      })
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!Array.isArray(approvals)) return []
    if (!q) return approvals
    return approvals.filter(
      (a) => {
        try {
          return (
            a?.expense?.merchantName?.toLowerCase().includes(q.toLowerCase()) ||
            a?.expense?.employee?.name?.toLowerCase().includes(q.toLowerCase()) ||
            a?.expense?.category?.toLowerCase().includes(q.toLowerCase()) ||
            a?.expense?.description?.toLowerCase().includes(q.toLowerCase())
          )
        } catch {
          return false
        }
      }
    )
  }, [approvals, q])

  async function handleAction(approvalId: string, action: "approve" | "reject") {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/approvals/${approvalId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.toUpperCase(), // API expects APPROVE/REJECT
          comments: comments || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action}`)
      }

      const result = await response.json()

      toast({
        title: `Expense ${action === 'approve' ? 'approved' : 'rejected'}`,
        description: result.message || `The expense has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      })

      // Refresh the approvals list
      await fetchApprovals()
      setSelectedApproval(null)
      setComments("")
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <Label htmlFor="search">Search/filter</Label>
            <Input
              id="search"
              placeholder="Search by merchant, employee, category, or description"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-foreground/60">Loading approvals...</div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/40">
                  <TableHead>Merchant</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered && filtered.length > 0 ? filtered.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>{a?.expense?.merchantName || 'N/A'}</TableCell>
                    <TableCell>{a?.expense?.employee?.name || 'N/A'}</TableCell>
                    <TableCell>{a?.expense?.category || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{a?.expense?.description || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{(a?.expense?.convertedAmount || 0).toFixed(2)} {a?.expense?.companyDefaultCurrency || 'USD'}</div>
                        <div className="text-xs text-foreground/60">
                          ({(a?.expense?.amount || 0).toFixed(2)} {a?.expense?.originalCurrency || 'USD'})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{a?.expense?.date ? new Date(a.expense.date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="h-9"
                          onClick={() => setSelectedApproval(a)}
                        >
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-foreground/60 py-8">
                      No pending approvals
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Expense</DialogTitle>
            <DialogDescription>
              Review the expense details and approve or reject
            </DialogDescription>
          </DialogHeader>
          
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-foreground/60">Merchant</Label>
                  <div className="text-sm">{selectedApproval.expense.merchantName}</div>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Employee</Label>
                  <div className="text-sm">{selectedApproval.expense.employee.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Category</Label>
                  <div className="text-sm">{selectedApproval.expense.category}</div>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Date</Label>
                  <div className="text-sm">{new Date(selectedApproval.expense.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Original Amount</Label>
                  <div className="text-sm">
                    {selectedApproval.expense.amount.toFixed(2)} {selectedApproval.expense.originalCurrency}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Converted Amount</Label>
                  <div className="text-sm">
                    {selectedApproval.expense.convertedAmount.toFixed(2)} {selectedApproval.expense.companyDefaultCurrency}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-foreground/60">Description</Label>
                <div className="text-sm">{selectedApproval.expense.description}</div>
              </div>

              {selectedApproval.expense.receiptUrl && (
                <div>
                  <Label className="text-xs text-foreground/60">Receipt</Label>
                  <a 
                    href={selectedApproval.expense.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    View Receipt
                  </a>
                </div>
              )}

              <div>
                <Label htmlFor="comments">Comments (optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments about this decision..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setSelectedApproval(null)
                    setComments("")
                  }}
                  disabled={actionLoading}
                  className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(selectedApproval._id, "reject")}
                  disabled={actionLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {actionLoading ? "Processing..." : "Reject"}
                </Button>
                <Button
                  onClick={() => handleAction(selectedApproval._id, "approve")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
