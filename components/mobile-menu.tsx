"use client"

import { cn } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

interface MobileMenuProps {
  className?: string
}

export const MobileMenu = ({ className }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()

  // Ensure component is mounted before rendering navigation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const userRole = session?.user?.role
    
    const baseItems = [
      { name: "Home", href: "/", roles: ["ADMIN", "MANAGER", "EMPLOYEE"] }
    ]

    const roleBasedItems = [
      { name: "Employee", href: "/employee", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
      { name: "AI Assistant", href: "/employee/assistant", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
      { name: "Manager", href: "/manager", roles: ["MANAGER", "ADMIN"] },
      { name: "Admin", href: "/admin", roles: ["ADMIN"] },
    ]

    const allItems = [...baseItems, ...roleBasedItems]

    // If user is not logged in, show only Home
    if (!userRole) {
      return [{ name: "Home", href: "/" }]
    }

    // Filter items based on user role
    return allItems.filter(item => item.roles.includes(userRole))
  }

  // Wait for mount before rendering filtered items
  const menuItems = mounted ? getNavigationItems() : [{ name: "Home", href: "/" }]

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const handleSignOut = () => {
    setIsOpen(false)
    signOut({ callbackUrl: "/" })
  }

  return (
    <Dialog.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn("group lg:hidden p-2 text-foreground transition-colors", className)}
          aria-label="Open menu"
        >
          <Menu className="group-[[data-state=open]]:hidden" size={24} />
          <X className="hidden group-[[data-state=open]]:block" size={24} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <div data-overlay="true" className="fixed z-30 inset-0 bg-black/50 backdrop-blur-sm" />

        <Dialog.Content
          onInteractOutside={(e) => {
            if (e.target instanceof HTMLElement && e.target.dataset.overlay !== "true") {
              e.preventDefault()
            }
          }}
          className="fixed top-0 left-0 w-full z-40 py-28 md:py-40"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          <nav className="flex flex-col space-y-6 container mx-auto">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className="text-xl font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 py-2"
              >
                {item.name}
              </Link>
            ))}

            {mounted && (
              <div className="mt-6 space-y-4">
                {session && (
                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30">
                        <span className="text-sm font-bold text-primary uppercase">
                          {session.user?.role?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-base font-medium text-foreground">
                          {session.user?.name}
                        </div>
                        <div className="text-sm text-foreground/60">
                          {session.user?.email}
                        </div>
                        <div className="text-xs text-primary font-mono uppercase">
                          {session.user?.role}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {session ? (
                  <button
                    onClick={handleSignOut}
                    className="inline-block text-xl font-mono uppercase text-primary transition-colors ease-out duration-150 hover:text-primary/80 py-2"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={handleLinkClick}
                    className="inline-block text-xl font-mono uppercase text-primary transition-colors ease-out duration-150 hover:text-primary/80 py-2"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            )}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
