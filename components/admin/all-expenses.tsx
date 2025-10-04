"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Expense = {
  _id: string
  merchantName: string
  description: string
  date: string
  category: string
  amount: number
  originalCurrency: string
  convertedAmount: number
  status: string
  receiptUrl?: string
  employeeId: {
    name: string
    email: string
  }
  createdAt: string
}

export function AllExpenses() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      fetchExpenses()
    }
  }, [session?.user?.email])

  async function fetchExpenses() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/expenses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }

      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error: any) {
      toast({
        title: "Failed to load expenses",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = expenses

    if (statusFilter !== "all") {
      list = list.filter((e) => e.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (query) {
      list = list.filter(
        (e) =>
          e.merchantName?.toLowerCase().includes(query.toLowerCase()) ||
          e.description?.toLowerCase().includes(query.toLowerCase()) ||
          e.category?.toLowerCase().includes(query.toLowerCase()) ||
          e.employeeId?.name?.toLowerCase().includes(query.toLowerCase())
      )
    }

    return list
  }, [expenses, query, statusFilter])

  function getStatusColor(status: string) {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
      case "REJECTED":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
      default:
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-foreground/60">Loading expenses...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sentient mb-1">All Expenses</h2>
        <p className="text-sm text-foreground/60">View and manage all company expenses</p>
      </div>

      <Card className="p-6 bg-background/40 border-border/50">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
                <Input
                  id="search"
                  placeholder="Search by merchant, description, category, or employee..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/40 hover:bg-background/40">
                  <TableHead>Employee</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-foreground/60">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((expense) => (
                    <TableRow key={expense._id} className="hover:bg-background/20">
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.employeeId?.name}</div>
                          <div className="text-xs text-foreground/60">{expense.employeeId?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{expense.merchantName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {expense.amount.toFixed(2)} {expense.originalCurrency}
                          </div>
                          {expense.originalCurrency !== 'USD' && (
                            <div className="text-xs text-foreground/60">
                              {expense.convertedAmount.toFixed(2)} USD
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedExpense(expense)}
                          className="p-2 hover:bg-background/80 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-foreground/60">
            <div>
              Showing {filtered.length} of {expenses.length} expenses
            </div>
          </div>
        </div>
      </Card>

      {/* Expense Details Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>Detailed information about this expense</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-foreground/60">Employee</Label>
                  <p className="font-medium">{selectedExpense.employeeId?.name}</p>
                  <p className="text-sm text-foreground/60">{selectedExpense.employeeId?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Status</Label>
                  <Badge className={getStatusColor(selectedExpense.status)}>
                    {selectedExpense.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-foreground/60">Merchant</Label>
                  <p className="font-medium">{selectedExpense.merchantName}</p>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Category</Label>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-foreground/60">Description</Label>
                <p>{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-foreground/60">Amount</Label>
                  <p className="text-lg font-bold">
                    {selectedExpense.amount.toFixed(2)} {selectedExpense.originalCurrency}
                  </p>
                  <p className="text-sm text-foreground/60">
                    Converted: {selectedExpense.convertedAmount.toFixed(2)} USD
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-foreground/60">Date</Label>
                  <p className="font-medium">
                    {new Date(selectedExpense.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedExpense.receiptUrl && (
                <div>
                  <Label className="text-xs text-foreground/60 block mb-2">Receipt</Label>
                  <a
                    href={selectedExpense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
