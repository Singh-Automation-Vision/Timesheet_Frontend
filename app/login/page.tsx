"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { fallbackLogin, shouldUseFallback } from "@/lib/api-fallback"
import { useAuth } from "@/lib/auth-context"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [useFallback, setUseFallback] = useState(false)
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  // Add a new state to track password visibility
  const [showPassword, setShowPassword] = useState(false)

  // Add a function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  useEffect(() => {
    const checkApi = async () => {
      try {
        const shouldFallback = await shouldUseFallback()
        setUseFallback(shouldFallback)
        setApiStatus(shouldFallback ? "offline" : "online")
      } catch (error) {
        console.error("Error checking API status:", error)
        setApiStatus("offline")
        setUseFallback(true)
      }
    }

    checkApi()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      let userData
      let responseMessage = "Login successful" // Default message

      if (useFallback) {
        console.log("Using fallback login mechanism")
        try {
          userData = await fallbackLogin(email, password)
          // For fallback, set message based on role
          responseMessage = email === "admin" ? "Admin login successful" : "Login successful"
        } catch (error) {
          console.error("Fallback login error:", error)
          throw new Error("Invalid username or password. Please try again.")
        }
      } else {
        console.log(`Attempting to login with API URL: ${API_BASE_URL}/api/login`)

        try {
          const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          // Check if the response is HTML (error page) or JSON
          const contentType = response.headers.get("content-type") || ""

          if (contentType.includes("text/html")) {
            console.error("Server returned HTML error page instead of JSON")
            throw new Error("Invalid username or password. Please try again.")
          }

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Login response error:", response.status, errorData)
            throw new Error(errorData.error || "Invalid username or password. Please try again.")
          }

          const result = await response.json()
          userData = result
          responseMessage = result.message || responseMessage // Get message from response if available
        } catch (error) {
          // If the error contains HTML, it's likely a server error page
          if (error instanceof Error && error.message.includes("<!doctype html>")) {
            console.error("Server returned HTML error page")
            throw new Error("Invalid username or password. Please try again.")
          }
          throw error
        }
      }

      console.log("Login successful, received data:", userData)

      if (userData && userData.user) {
        // Ensure the user object has the correct role
        const userToStore = {
          ...userData.user,
          name: email,
          role: responseMessage === "Admin login successful" ? "admin" : "user",
        }
        login(userToStore)

        toast({
          title: "Success",
          description: responseMessage,
        })

        console.log("Response message:", responseMessage)

        // Navigate based on the response message
        if (responseMessage === "Admin login successful") {
          console.log("Redirecting to admin page...")
          router.push("/admin")
        } else {
          console.log("Redirecting to dashboard...")
          router.push("/dashboard")
        }
      } else {
        throw new Error("Invalid user data received")
      }
    } catch (error) {
      console.error("Login error details:", error)

      let message = "Invalid username or password. Please try again."
      if (error instanceof Error) {
        // Check if the error message contains HTML (server error page)
        if (error.message.includes("<!doctype html>")) {
          message = "Invalid username or password. Please try again."
        } else {
          message = error.message
        }
      }

      setErrorMessage(message)
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-between min-h-screen bg-gray-100 p-4">
      <div className="flex items-center justify-center flex-grow">
        <Card className="w-full max-w-md">
          <CardContent className="pt-4">
            <div className="flex justify-center mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/D1D1D1-GuB2iWjpOCtuUimPuBibjh2TTwi5Fv.png"
                alt="Singh Automation"
                width={180}
                height={36}
                priority
              />
            </div>
            {apiStatus === "offline" && (
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-yellow-800">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-xs">API server appears to be offline. Using local authentication.</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {errorMessage && <div className="text-red-500 text-sm py-1">{errorMessage}</div>}
              {useFallback && (
                <div className="text-xs text-gray-500 mb-2">
                  <p>Demo credentials:</p>
                  <p>Username: admin, Password: admin</p>
                  <p>Username: bhargav, Password: BNG</p>
                </div>
              )}
              <Button type="submit" className="w-full py-1 text-sm" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="text-center text-sm text-gray-500 mt-4">Copyright © 2025 SinghAutomation</div>
    </div>
  )
}

