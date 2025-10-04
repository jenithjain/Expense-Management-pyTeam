"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type User = {
  _id: string
  name: string
  email: string
  role: string
}

type Approver = {
  approverId: string
  approverName: string
  stepNumber: number
  required: boolean
}

type ApprovalRule = {
  _id?: string
  category?: string
  minAmount?: number
  maxAmount?: number
  approvers: Approver[]
  requireAllApprovers: boolean
  minApprovalPercentage?: number
  specificApproverId?: string
  isManagerFirst: boolean
}

export function ApprovalRulesManagement() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [rules, setRules] = useState<ApprovalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [newRule, setNewRule] = useState<ApprovalRule>({
    category: "",
    minAmount: undefined,
    maxAmount: undefined,
    approvers: [],
    requireAllApprovers: true,
    minApprovalPercentage: undefined,
    specificApproverId: undefined,
    isManagerFirst: true,
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchUsers()
      fetchRules()
    }
  }, [session?.user?.email])

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users/company')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users?.filter((u: User) => u.role === 'MANAGER' || u.role === 'ADMIN') || [])
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function fetchRules() {
    setLoading(true)
    try {
      const response = await fetch('/api/approval-rules')
      
      if (!response.ok) {
        throw new Error('Failed to fetch rules')
      }

      const data = await response.json()
      setRules(data.rules || [])
    } catch (error: any) {
      toast({
        title: "Failed to load rules",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function addApprover() {
    if (users.length === 0) {
      toast({
        title: "No managers available",
        description: "Please create managers first",
        variant: "destructive",
      })
      return
    }

    setNewRule((prev) => ({
      ...prev,
      approvers: [
        ...prev.approvers,
        {
          approverId: users[0]._id,
          approverName: users[0].name,
          stepNumber: prev.approvers.length,
          required: true,
        },
      ],
    }))
  }

  function removeApprover(index: number) {
    setNewRule((prev) => ({
      ...prev,
      approvers: prev.approvers
        .filter((_, i) => i !== index)
        .map((a, i) => ({ ...a, stepNumber: i })),
    }))
  }

  function moveApprover(index: number, direction: 'up' | 'down') {
    const newApprovers = [...newRule.approvers]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newApprovers.length) return

    ;[newApprovers[index], newApprovers[targetIndex]] = [newApprovers[targetIndex], newApprovers[index]]
    
    // Update step numbers
    newApprovers.forEach((a, i) => {
      a.stepNumber = i
    })

    setNewRule((prev) => ({ ...prev, approvers: newApprovers }))
  }

  function updateApprover(index: number, field: keyof Approver, value: any) {
    setNewRule((prev) => ({
      ...prev,
      approvers: prev.approvers.map((a, i) => {
        if (i === index) {
          if (field === 'approverId') {
            const user = users.find(u => u._id === value)
            return { ...a, approverId: value, approverName: user?.name || '' }
          }
          return { ...a, [field]: value }
        }
        return a
      }),
    }))
  }

  async function handleSaveRule() {
    if (!newRule.category) {
      toast({
        title: "Missing category",
        description: "Please specify a category for this rule",
        variant: "destructive",
      })
      return
    }

    if (newRule.approvers.length === 0) {
      toast({
        title: "No approvers",
        description: "Please add at least one approver",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/approval-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRule),
      })

      if (!response.ok) {
        throw new Error('Failed to create rule')
      }

      toast({
        title: "Rule created",
        description: "Approval rule has been created successfully",
      })

      fetchRules()
      
      // Reset form
      setNewRule({
        category: "",
        minAmount: undefined,
        maxAmount: undefined,
        approvers: [],
        requireAllApprovers: true,
        minApprovalPercentage: undefined,
        specificApproverId: undefined,
        isManagerFirst: true,
      })
    } catch (error: any) {
      toast({
        title: "Failed to create rule",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      const response = await fetch(`/api/approval-rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete rule')
      }

      toast({
        title: "Rule deleted",
        description: "Approval rule has been deleted successfully",
      })

      fetchRules()
    } catch (error: any) {
      toast({
        title: "Failed to delete rule",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-foreground/60">Loading approval rules...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sentient mb-1">Approval Rules</h2>
        <p className="text-sm text-foreground/60">Configure expense approval workflows and thresholds</p>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Rule</TabsTrigger>
          <TabsTrigger value="existing">Existing Rules ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card className="p-6 bg-background/40 border-border/50">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Expense Category</Label>
                  <Select
                    value={newRule.category}
                    onValueChange={(v) => setNewRule({ ...newRule, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Accommodation">Accommodation</SelectItem>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <Checkbox
                    checked={newRule.isManagerFirst}
                    onCheckedChange={(checked) => setNewRule({ ...newRule, isManagerFirst: !!checked })}
                    id="managerFirst"
                  />
                  <Label htmlFor="managerFirst">Manager approves first (if assigned)</Label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Minimum Amount (Optional)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="e.g., 100"
                    value={newRule.minAmount || ""}
                    onChange={(e) => setNewRule({ ...newRule, minAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Maximum Amount (Optional)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder="e.g., 1000"
                    value={newRule.maxAmount || ""}
                    onChange={(e) => setNewRule({ ...newRule, maxAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Approval Sequence</Label>
                  <button
                    onClick={addApprover}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Approver
                  </button>
                </div>

                {newRule.approvers.length === 0 ? (
                  <div className="text-center py-8 text-foreground/60 border border-dashed border-border/50 rounded-lg">
                    No approvers added. Click "Add Approver" to start.
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/40 hover:bg-background/40">
                          <TableHead className="w-16">Step</TableHead>
                          <TableHead>Approver</TableHead>
                          <TableHead className="w-32">Required</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newRule.approvers.map((approver, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono font-bold">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={approver.approverId}
                                onValueChange={(v) => updateApprover(index, 'approverId', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user._id} value={user._id}>
                                      {user.name} ({user.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={approver.required}
                                onCheckedChange={(checked) => updateApprover(index, 'required', !!checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => moveApprover(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-background/80 rounded disabled:opacity-30"
                                >
                                  <MoveUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveApprover(index, 'down')}
                                  disabled={index === newRule.approvers.length - 1}
                                  className="p-1 hover:bg-background/80 rounded disabled:opacity-30"
                                >
                                  <MoveDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeApprover(index)}
                                  className="p-1 hover:bg-destructive/20 rounded text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Conditional Approval (Optional)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentage">Minimum Approval Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g., 60"
                      value={newRule.minApprovalPercentage || ""}
                      onChange={(e) => setNewRule({ ...newRule, minApprovalPercentage: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                    <p className="text-xs text-foreground/60 mt-1">
                      Expense approved if this % of approvers approve
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="specific">Auto-approve if specific person approves</Label>
                    <Select
                      value={newRule.specificApproverId || "none"}
                      onValueChange={(v) => setNewRule({ ...newRule, specificApproverId: v === 'none' ? undefined : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-foreground/60 mt-1">
                      e.g., If CFO approves, auto-approve
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveRule} disabled={saving}>
                  {saving ? "Creating..." : "Create Approval Rule"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="space-y-4">
          {rules.length === 0 ? (
            <Card className="p-12 bg-background/40 border-border/50 text-center">
              <p className="text-foreground/60">No approval rules configured yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule._id} className="p-6 bg-background/40 border-border/50">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {rule.category || 'All Categories'}
                        </h3>
                        {(rule.minAmount || rule.maxAmount) && (
                          <p className="text-sm text-foreground/60">
                            Amount: {rule.minAmount ? `${rule.minAmount}+` : ''} 
                            {rule.minAmount && rule.maxAmount ? ' - ' : ''}
                            {rule.maxAmount ? `up to ${rule.maxAmount}` : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => rule._id && handleDeleteRule(rule._id)}
                        className="p-2 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Approval Sequence:</p>
                      <div className="space-y-2">
                        {rule.isManagerFirst && (
                          <div className="flex items-center gap-2 text-sm p-2 bg-primary/10 rounded">
                            <span className="font-mono font-bold">0</span>
                            <span>Employee's Manager (if assigned)</span>
                          </div>
                        )}
                        {rule.approvers.map((approver, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm p-2 bg-background/60 rounded">
                            <span className="font-mono font-bold">{index + 1}</span>
                            <span>{approver.approverName}</span>
                            {approver.required && (
                              <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {(rule.minApprovalPercentage || rule.specificApproverId) && (
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-sm font-medium mb-1">Conditional Approval:</p>
                        {rule.minApprovalPercentage && (
                          <p className="text-sm text-foreground/70">
                            • Auto-approve if {rule.minApprovalPercentage}% of approvers approve
                          </p>
                        )}
                        {rule.specificApproverId && (
                          <p className="text-sm text-foreground/70">
                            • Auto-approve if specific approver approves
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
