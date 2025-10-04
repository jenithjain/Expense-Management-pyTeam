"use client"

import { useState } from "react"
import { 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  Shield, 
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "users", label: "User Management", icon: <Users className="w-5 h-5" /> },
  { id: "approval-rules", label: "Approval Rules", icon: <Shield className="w-5 h-5" /> },
  { id: "expenses", label: "All Expenses", icon: <FileText className="w-5 h-5" /> },
  { id: "company", label: "Company Settings", icon: <Building2 className="w-5 h-5" /> },
  { id: "settings", label: "System Settings", icon: <Settings className="w-5 h-5" /> },
]

type AdminSidebarProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-background/95 backdrop-blur-md border-r border-border/50 z-40 transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary" />
                  <span className="font-sentient text-lg">Admin Panel</span>
                </div>
              )}
              <button
                className="hidden lg:flex p-2 hover:bg-background/80 rounded-lg transition-colors"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id)
                  setMobileOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-primary/10 hover:text-primary",
                  activeTab === item.id
                    ? "bg-primary/20 text-primary font-medium shadow-sm"
                    : "text-foreground/70",
                  collapsed && "justify-center"
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border/50">
            {!collapsed && (
              <div className="mb-3 px-2">
                <p className="text-xs text-foreground/60">Logged in as</p>
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-foreground/60 truncate">{session?.user?.email}</p>
              </div>
            )}
            <button
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-background/50 hover:bg-destructive/10 hover:border-destructive transition-colors",
                collapsed && "px-2 justify-center"
              )}
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
