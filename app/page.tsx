"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"

export default function Home() {
  const { user } = useAuth()
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    // Set initial date and time
    updateDateTime()

    // Update date and time every second
    const interval = setInterval(updateDateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const updateDateTime = () => {
    const now = new Date()
    const formattedDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    setCurrentDateTime(`${formattedDate} ${formattedTime}`)
  }

  if (!user) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white">
      <h1 className="text-4xl font-bold mb-4 text-[#00FF00]">Welcome, {user.name}</h1>
      <p className="text-xl text-gray-600">{currentDateTime}</p>
    </div>
  )
}

