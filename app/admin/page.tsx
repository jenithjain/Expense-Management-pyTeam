"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminOverview } from "@/components/admin/admin-overview"
import { UserManagement } from "@/components/admin/user-management"
import { ApprovalRulesManagement } from "@/components/admin/approval-rules-management"
import { AllExpenses } from "@/components/admin/all-expenses"
import { CompanySettings } from "@/components/admin/company-settings"
import { Chatbot } from "@/components/shared/chatbot"
import { GL } from "@/components/gl"
import { Sparkles } from "lucide-react"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <main className="relative min-h-screen bg-background">
      <GL hovering={false} />
      
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="lg:pl-64 transition-all duration-300 pt-24 lg:pt-28">
        <div className="p-6 md:p-8 relative z-10">
          {activeTab === "overview" && <AdminOverview />}
          {activeTab === "assistant" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-sentient mb-1">AI Assistant</h2>
                  <p className="text-sm text-foreground/60">System configuration and management support</p>
                </div>
              </div>
              <Chatbot 
                variant="embedded"
                placeholder="Ask about system config, users, policies, or statistics..."
                suggestedQuestions={[
                  "Show me the company statistics",
                  "What's the total expense breakdown?",
                  "Who is the manager for a specific user?",
                  "What's the approval rule for Marketing?",
                  "How many users are in the system?"
                ]}
              />
            </div>
          )}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-sentient mb-1">User Management</h2>
                <p className="text-sm text-foreground/60">Create users, assign roles and managers</p>
              </div>
              <UserManagement />
            </div>
          )}
          {activeTab === "approval-rules" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-sentient mb-1">Approval Rules</h2>
                <p className="text-sm text-foreground/60">Configure expense approval workflows</p>
              </div>
              <ApprovalRulesManagement />
            </div>
          )}
          {activeTab === "expenses" && <AllExpenses />}
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-sentient mb-1">System Settings</h2>
                <p className="text-sm text-foreground/60">Configure system-wide settings</p>
              </div>
              <div className="bg-background/40 border border-border/50 rounded-lg p-12 text-center">
                <p className="text-foreground/60">System settings coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
