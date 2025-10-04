"use client"

import { GL } from "@/components/gl"
import { GlassCard } from "@/components/shared/glass-card"
import { ExpenseHistory } from "@/components/employee/expense-history"
import { ExpenseForm } from "@/components/employee/expense-form"

export default function EmployeePage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard>
          <ExpenseHistory />
        </GlassCard>
        <GlassCard>
          <ExpenseForm />
        </GlassCard>
      </div>
    </main>
  )
}
