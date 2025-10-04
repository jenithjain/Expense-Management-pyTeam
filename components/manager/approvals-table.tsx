"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type Approval = {
  id: string
  subject: string
  owner: string
  category: string
  status: "Waiting Approval" | "Approved" | "Rejected"
  amount: number
  currency: string
  locked?: boolean // when action taken
}

const seed: Approval[] = [
  {
    id: "a1",
    subject: "Hotel - NYC Trip",
    owner: "Carol Lee",
    category: "Lodging",
    status: "Waiting Approval",
    amount: 210,
    currency: "USD",
  },
  {
    id: "a2",
    subject: "Client Lunch",
    owner: "Carol Lee",
    category: "Meals",
    status: "Waiting Approval",
    amount: 68.5,
    currency: "USD",
  },
  {
    id: "a3",
    subject: "Taxi",
    owner: "Carol Lee",
    category: "Transport",
    status: "Approved",
    amount: 24,
    currency: "USD",
    locked: true,
  },
]

export function ApprovalsTable() {
  const [list, setList] = useState<Approval[]>(seed)
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    if (!q) return list
    return list.filter(
      (i) =>
        i.subject.toLowerCase().includes(q.toLowerCase()) ||
        i.owner.toLowerCase().includes(q.toLowerCase()) ||
        i.category.toLowerCase().includes(q.toLowerCase()),
    )
  }, [list, q])

  function setStatus(id: string, status: Approval["status"]) {
    setList((l) => l.map((x) => (x.id === id ? { ...x, status, locked: true } : x)))
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <div className="md:col-span-2">
          <Label htmlFor="search">Search/filter</Label>
          <Input
            id="search"
            placeholder="Search by subject, owner or category"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/40">
              <TableHead>Approval Subject</TableHead>
              <TableHead>Request Owner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Request Status</TableHead>
              <TableHead>Total (Company Currency)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.subject}</TableCell>
                <TableCell>{a.owner}</TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell className="font-mono">{a.status}</TableCell>
                <TableCell>
                  {a.amount.toFixed(2)} {a.currency}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-9" disabled={a.locked} onClick={() => setStatus(a.id, "Approved")}>
                      Approve
                    </Button>
                    <Button size="sm" className="h-9" disabled={a.locked} onClick={() => setStatus(a.id, "Rejected")}>
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground/60 py-8">
                  No approvals found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
