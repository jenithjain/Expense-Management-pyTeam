"use client"

import { GL } from "@/components/gl"
import { GlassCard } from "@/components/shared/glass-card"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminPage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10 grid gap-6">
        <GlassCard>
          <div className="mb-4">
            <h1 className="text-xl font-sentient text-white">User Management</h1>
            <p className="font-mono text-xs text-white/70">Create users, assign roles and managers</p>
          </div>
          <UserManagement />
        </GlassCard>
      </div>
    </main>
  )
}
