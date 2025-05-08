"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user.name) {
      router.push("/login")
    } else {
      setUserName(user.name)
      const date = new Date()
      setCurrentDate(
        date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      )
    }
  }, [router])

  if (!userName) {
    return null // or a loading spinner
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-4">
      <h1 className="text-3xl font-bold mb-2 text-[#00FF00]">Welcome, {userName}</h1>
      <p className="text-lg text-gray-600">{currentDate}</p>
    </div>
  )
}
