"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type Expense = {
  _id: string
  merchantName: string
  description: string
  date: string
  category: string
  amount: number
  originalCurrency: string
  convertedAmount: number
  companyDefaultCurrency: string
  status: "Pending" | "Partially Approved" | "Approved" | "Rejected" | "On Hold"
  receiptUrl?: string
  createdAt: string
}

export function ExpenseHistory() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (session?.user?.email) {
      fetchExpenses()
    }
  }, [session?.user?.email, page])

  async function fetchExpenses() {
    if (!session?.user?.email) return

    setLoading(true)
    try {
      const response = await fetch(`/api/expenses/my-expenses?page=${page}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }

      const data = await response.json()
      setExpenses(data.expenses || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error: any) {
      toast({
        title: "Failed to load expenses",
        description: error.message,
        variant: "destructive",
      })
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!Array.isArray(expenses)) return []
    let list = expenses
    if (tab === "pending") list = list.filter((i) => i.status === "Pending" || i.status === "Partially Approved")
    if (tab === "approved") list = list.filter((i) => i.status === "Approved")
    if (tab === "rejected") list = list.filter((i) => i.status === "Rejected" || i.status === "On Hold")
    if (q) {
      list = list.filter(
        (i) =>
          i?.description?.toLowerCase().includes(q.toLowerCase()) || 
          i?.category?.toLowerCase().includes(q.toLowerCase()) ||
          i?.merchantName?.toLowerCase().includes(q.toLowerCase())
      )
    }
    return list
  }, [q, tab, expenses])

  function getStatusColor(status: string) {
    switch (status) {
      case "Approved":
        return "bg-green-500/20 text-green-700 dark:text-green-400"
      case "Rejected":
      case "On Hold":
        return "bg-red-500/20 text-red-700 dark:text-red-400"
      case "Partially Approved":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      default:
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400"
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-sentient">Expense History</h2>
        <p className="font-mono text-xs text-foreground/60">Track your requests and statuses</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="all" />
        <TabsContent value="pending" />
        <TabsContent value="approved" />
        <TabsContent value="rejected" />
      </Tabs>

      <div className="grid gap-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by description, category, or merchant"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground/60">Loading expenses...</div>
      ) : (
        <>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/40">
                  <TableHead>Merchant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Converted Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered && filtered.length > 0 ? filtered.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell>{e?.merchantName || 'N/A'}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{e?.description || 'N/A'}</TableCell>
                    <TableCell>{e?.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{e?.category || 'N/A'}</TableCell>
                    <TableCell>
                      {(e?.amount || 0).toFixed(2)} {e?.originalCurrency || 'USD'}
                    </TableCell>
                    <TableCell>
                      {(e?.convertedAmount || 0).toFixed(2)} {e?.companyDefaultCurrency || 'USD'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(e?.status || 'Pending')}>
                        {e?.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e?.receiptUrl ? (
                        <a 
                          href={e.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-foreground/60 py-8">
                      {loading ? 'Loading expenses...' : 'No expenses found. Submit your first expense above!'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Previous
              </Button>
              <span className="text-sm text-foreground/60">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
