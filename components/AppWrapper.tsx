"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/lib/auth-context"

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.push("/login")
      }
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {user && <Navbar />}
      <main className="flex-grow">{children}</main>
    </>
  )
}

