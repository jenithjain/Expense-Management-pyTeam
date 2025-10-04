"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Expense = {
  id: string
  employee: string
  description: string
  date: string
  category: string
  paidBy: string
  remarks?: string
  amount: number
  currency: string
  status: "Draft" | "Submitted" | "Waiting Approval" | "Approved" | "Rejected"
}

const seed: Expense[] = [
  {
    id: "e1",
    employee: "Carol Lee",
    description: "Client lunch",
    date: "2025-10-02",
    category: "Meals",
    paidBy: "Personal",
    remarks: "With ACME",
    amount: 68.5,
    currency: "USD",
    status: "Submitted",
  },
  {
    id: "e2",
    employee: "Carol Lee",
    description: "Taxi",
    date: "2025-09-28",
    category: "Transport",
    paidBy: "Corporate",
    amount: 24,
    currency: "USD",
    status: "Approved",
  },
  {
    id: "e3",
    employee: "Carol Lee",
    description: "Hotel",
    date: "2025-09-26",
    category: "Lodging",
    paidBy: "Personal",
    amount: 210,
    currency: "USD",
    status: "Waiting Approval",
  },
]

export function ExpenseHistory() {
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<"draft" | "waiting" | "approved" | "all">("all")
  const filtered = useMemo(() => {
    let list = seed
    if (tab === "draft") list = list.filter((i) => i.status === "Draft" || i.status === "Submitted")
    if (tab === "waiting") list = list.filter((i) => i.status === "Waiting Approval" || i.status === "Submitted")
    if (tab === "approved") list = list.filter((i) => i.status === "Approved")
    if (q) {
      list = list.filter(
        (i) =>
          i.description.toLowerCase().includes(q.toLowerCase()) || i.category.toLowerCase().includes(q.toLowerCase()),
      )
    }
    return list
  }, [q, tab])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-sentient">Expense History</h2>
        <p className="font-mono text-xs text-foreground/60">Track your requests and statuses</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="waiting">Waiting Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
        <TabsContent value="all" />
        <TabsContent value="draft" />
        <TabsContent value="waiting" />
        <TabsContent value="approved" />
      </Tabs>

      <div className="grid gap-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by description or category"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/40">
              <TableHead>Employee</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.employee}</TableCell>
                <TableCell className="max-w-[240px] truncate">{e.description}</TableCell>
                <TableCell>{e.date}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>{e.paidBy}</TableCell>
                <TableCell className="max-w-[200px] truncate">{e.remarks || "-"}</TableCell>
                <TableCell>
                  {e.amount.toFixed(2)} {e.currency}
                </TableCell>
                <TableCell>
                  <span className="font-mono">{e.status === "Submitted" ? "Submitted" : e.status}</span>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-foreground/60 py-8">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
