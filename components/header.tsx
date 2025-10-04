"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { MobileMenu } from "./mobile-menu"
import { useEffect, useState } from "react"

export const Header = () => {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

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

  // Wait for mount and session to be loaded before rendering filtered items
  const navigationItems = mounted ? getNavigationItems() : [{ name: "Home", href: "/" }]

  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container">

        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-8">
          {navigationItems.map((item) => (
            <Link
              className="uppercase inline-block font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out"
              href={item.href}
              key={item.name}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        {mounted && (
          <>
            {session ? (
              <div className="flex items-center gap-2 max-lg:hidden">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {session.user?.name}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {session.user?.email}
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/30">
                    <span className="text-xs font-bold text-primary uppercase">
                      {session.user?.role?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                {/* Sign Out Button */}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="uppercase transition-colors ease-out duration-150 font-mono text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                className="uppercase max-lg:hidden transition-colors ease-out duration-150 font-mono text-primary hover:text-primary/80"
                href="/auth/login"
              >
                Sign In
              </Link>
            )}
          </>
        )}
        <MobileMenu />
      </header>
    </div>
  )
}
