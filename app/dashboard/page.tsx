"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    // Format the current date to show day, month, date, year
    const now = new Date()
    const formattedDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    setCurrentDate(formattedDate)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      console.log("Current user:", user)
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view this page",
          variant: "destructive",
        })
        router.push("/login")
      } else if (user?.role === "admin") {
        router.push("/admin")
      }
    }
  }, [user, isLoading, router, toast])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white">
      <h1 className="text-4xl font-bold mb-4 text-[#00FF00]">Welcome, {user.name}</h1>
      <p className="text-xl text-gray-600">{currentDate}</p>
    </div>
  )
}
