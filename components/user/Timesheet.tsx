"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

interface Task {
  time: string
  description: string
}

export default function Timesheet() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [amSubmitted, setAmSubmitted] = useState(false)
  const [pmSubmitted, setPmSubmitted] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const hours = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ]

  useEffect(() => {
    setTasks(hours.map((hour) => ({ time: hour, description: "" })))
    checkSubmissionStatus()
  }, [])

  const checkSubmissionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/timesheet/status`)
      if (response.ok) {
        const data = await response.json()
        setAmSubmitted(data.amSubmitted)
        setPmSubmitted(data.pmSubmitted)
      } else {
        throw new Error("Failed to check submission status")
      }
    } catch (error) {
      console.error("Error checking submission status:", error)
      toast({
        title: "Error",
        description: "Failed to check submission status",
        variant: "destructive",
      })
    }
  }

  const handleTaskChange = (index: number, description: string) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks]
      newTasks[index] = { ...newTasks[index], description }
      return newTasks
    })
  }

  const handleSubmit = async (period: "AM" | "PM") => {
    const currentDate = new Date().toISOString().split("T")[0] // Get current date in YYYY-MM-DD format
    const data = {
      username: user?.name || "Unknown User",
      date: currentDate,
      period: period,
      tasks: tasks.filter((task) =>
        period === "AM" ? Number.parseInt(task.time) < 12 : Number.parseInt(task.time) >= 12,
      ),
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/timesheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message,
        })
        if (period === "AM") setAmSubmitted(true)
        if (period === "PM") setPmSubmitted(true)
      } else {
        throw new Error("Failed to save timesheet")
      }
    } catch (error) {
      console.error("Error saving timesheet:", error)
      toast({
        title: "Error",
        description: "Failed to save timesheet",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Timesheet</CardTitle>
        <CardDescription>Log your daily tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="am">
          <TabsList>
            <TabsTrigger value="am">AM</TabsTrigger>
            <TabsTrigger value="pm">PM</TabsTrigger>
          </TabsList>
          <TabsContent value="am">
            {tasks
              .filter((task) => Number.parseInt(task.time) < 12)
              .map((task, index) => (
                <div key={task.time} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">{task.time}</label>
                  <Input
                    type="text"
                    value={task.description}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    placeholder="Enter task description"
                    disabled={amSubmitted}
                  />
                </div>
              ))}
            <Button onClick={() => handleSubmit("AM")} disabled={amSubmitted}>
              {amSubmitted ? "AM Submitted" : "Submit AM"}
            </Button>
          </TabsContent>
          <TabsContent value="pm">
            {tasks
              .filter((task) => Number.parseInt(task.time) >= 12)
              .map((task, index) => (
                <div key={task.time} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">{task.time}</label>
                  <Input
                    type="text"
                    value={task.description}
                    onChange={(e) => handleTaskChange(index + 5, e.target.value)}
                    placeholder="Enter task description"
                    disabled={pmSubmitted}
                  />
                </div>
              ))}
            <Button onClick={() => handleSubmit("PM")} disabled={pmSubmitted}>
              {pmSubmitted ? "PM Submitted" : "Submit PM"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

