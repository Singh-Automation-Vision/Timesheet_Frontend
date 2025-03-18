"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Home, ClipboardList, BarChart2, LogOut, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [user, setUser] = useState<{ role: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const updateUserFromStorage = useCallback(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // Initial load
    updateUserFromStorage()

    // Set up interval to check for user changes
    const interval = setInterval(() => {
      updateUserFromStorage()
    }, 1000) // Check every second

    return () => {
      clearInterval(interval)
    }
  }, [updateUserFromStorage])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user")
    setUser(null)
    window.dispatchEvent(new Event("auth-change"))
    router.push("/login")
  }, [router])

  if (!user) return null

  return (
    <nav className="bg-white dark:bg-gray-800 text-black dark:text-white border-b border-primary py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/D1D1D1-GuB2iWjpOCtuUimPuBibjh2TTwi5Fv.png"
              alt="Singh Automation"
              width={200}
              height={40}
              className="h-12 w-auto"
              priority
            />
          </div>
          <div className="flex items-center space-x-2">
            <NavLink href="/" active={pathname === "/"}>
              <Home className="w-4 h-4 mr-1" />
              Home
            </NavLink>

            {user.role === "admin" ? (
              <>
                <NavLink href="/timesheet-view" active={pathname === "/timesheet-view"}>
                  <Search className="w-4 h-4 mr-1" />
                  View Timesheets
                </NavLink>
                <NavLink href="/admin" active={pathname === "/admin"}>
                  Admin
                </NavLink>
              </>
            ) : (
              <>
                <NavLink href="/timesheet" active={pathname === "/timesheet"}>
                  <ClipboardList className="w-4 h-4 mr-1" />
                  Timesheet
                </NavLink>
                <NavLink href="/matrices" active={pathname === "/matrices"}>
                  <BarChart2 className="w-4 h-4 mr-1" />
                  Matrices
                </NavLink>
              </>
            )}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center px-2 py-1 rounded-md text-sm font-medium transition-all duration-300 text-black dark:text-white hover:bg-primary/10"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-2 py-1 rounded-md text-sm font-medium transition-all duration-300 ${
        active ? "bg-primary text-black" : "text-black dark:text-white hover:bg-primary/10"
      }`}
    >
      {children}
    </Link>
  )
}

