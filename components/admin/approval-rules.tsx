"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Approver = { id: string; name: string; required: boolean }

const seedApprovers: Approver[] = [
  { id: "a1", name: "Bob Smith", required: true },
  { id: "a2", name: "Alice Johnson", required: false },
  { id: "a3", name: "Carol Lee", required: false },
]

export function ApprovalRules() {
  const [rule, setRule] = useState({
    user: "",
    description: "",
    manager: "bob",
    isManagerApprover: true,
    approvers: seedApprovers,
    sequenced: false,
    minApprovalPct: 100,
  })

  function update<K extends keyof typeof rule>(k: K, v: any) {
    setRule((r) => ({ ...r, [k]: v }))
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="user">User</Label>
          <Input id="user" placeholder="User name" value={rule.user} onChange={(e) => update("user", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="manager">Manager (for misc expenses)</Label>
          <Select value={rule.manager} onValueChange={(v) => update("manager", v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bob">Bob Smith</SelectItem>
              <SelectItem value="alice">Alice Johnson</SelectItem>
              <SelectItem value="carol">Carol Lee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="desc">Description about rules</Label>
        <Textarea
          id="desc"
          placeholder="Describe the rule intent"
          value={rule.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          checked={rule.isManagerApprover}
          onCheckedChange={(v) => update("isManagerApprover", !!v)}
          id="isMgr"
        />
        <Label htmlFor="isMgr">Is manager an approver?</Label>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/40">
              <TableHead>Approver</TableHead>
              <TableHead>Required</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rule.approvers.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={a.required}
                      onCheckedChange={(v) =>
                        update(
                          "approvers",
                          rule.approvers.map((x) => (x.id === a.id ? { ...x, required: !!v } : x)),
                        )
                      }
                      id={`req-${a.id}`}
                    />
                    <Label htmlFor={`req-${a.id}`}>Required</Label>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox checked={rule.sequenced} onCheckedChange={(v) => update("sequenced", !!v)} id="sequence" />
        <Label htmlFor="sequence">Approvers Sequence</Label>
        <span className="text-foreground/60 text-xs font-mono">If enabled, requests move in order of approvers.</span>
      </div>

      <div className="grid gap-2 max-w-xs">
        <Label htmlFor="minPct">Minimum Approval percentage</Label>
        <div className="flex items-center gap-2">
          <Input
            id="minPct"
            type="number"
            min={1}
            max={100}
            value={rule.minApprovalPct}
            onChange={(e) => update("minApprovalPct", Number(e.target.value))}
          />
          <span className="text-sm font-mono">%</span>
        </div>
      </div>

      <Button className="mt-2 w-fit">Save rules</Button>
    </div>
  )
}
