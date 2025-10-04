"use client"

import { GL } from "@/components/gl"
import { GlassCard } from "@/components/shared/glass-card"
import { UserManagement } from "@/components/admin/user-management"
import { ApprovalRules } from "@/components/admin/approval-rules"

export default function AdminPage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10 grid gap-6 md:grid-cols-2">
        <GlassCard>
          <div className="mb-4">
            <h1 className="text-xl font-sentient">User Management</h1>
            <p className="font-mono text-xs text-foreground/60">Create users, assign roles and managers</p>
          </div>
          <UserManagement />
        </GlassCard>
        <GlassCard>
          <div className="mb-4">
            <h2 className="text-xl font-sentient">Approval Rules</h2>
            <p className="font-mono text-xs text-foreground/60">Define approvers and sequences</p>
          </div>
          <ApprovalRules />
        </GlassCard>
      </div>
    </main>
  )
}
