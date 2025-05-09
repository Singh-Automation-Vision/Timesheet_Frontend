"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/SplashScreen"
import AppWrapper from "@/components/AppWrapper"
import { usePathname } from "next/navigation"

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown")
    if (splashShown) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem("splashShown", "true")
  }

  if (pathname === "/login") {
    return <>{children}</>
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return <AppWrapper>{children}</AppWrapper>
}
