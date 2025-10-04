"use client"

import { GL } from "@/components/gl"
import { GlassCard } from "@/components/shared/glass-card"
import { ApprovalsTable } from "@/components/manager/approvals-table"

export default function ManagerPage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10">
        <GlassCard>
          <div className="mb-4">
            <h1 className="text-xl font-sentient">Approvals to Review</h1>
            <p className="font-mono text-xs text-foreground/60">Approve or reject pending requests</p>
          </div>
          <ApprovalsTable />
        </GlassCard>
      </div>
    </main>
  )
}
