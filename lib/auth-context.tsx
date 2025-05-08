"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserSession = () => {
      try {
        const storedUser = localStorage.getItem("user")
        const sessionCookie = document.cookie.includes("session=")

        if (storedUser && sessionCookie) {
          const parsedUser = JSON.parse(storedUser)
          console.log("Retrieved user from storage:", parsedUser)
          setUser(parsedUser)
        } else {
          console.log("No valid user session found")
          setUser(null)
        }
      } catch (error) {
        console.error("Error checking user session:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserSession()
    window.addEventListener("storage", checkUserSession)

    return () => {
      window.removeEventListener("storage", checkUserSession)
    }
  }, [])

  const login = (userData: User) => {
    console.log("Setting user in auth context:", userData)
    // Ensure role is properly set
    const userWithRole = {
      ...userData,
      role: userData.role || "user", // Default to user if no role specified
    }
    setUser(userWithRole)
    localStorage.setItem("user", JSON.stringify(userWithRole))
    // Set a session cookie
    document.cookie = `session=${userData.id}; path=/; max-age=3600; SameSite=Strict`
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    // Remove the session cookie
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
