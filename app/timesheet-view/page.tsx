"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CalendarIcon, User } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface TimesheetData {
  data: {
    AM?: {
      date: string
      employee_name: string
      hours: Array<{
        hour: string
        task: string
      }>
      shift: string
    }
    PM?: {
      date: string
      employee_name: string
      hours: Array<{
        hour: string
        task: string
        progress: string
        comments: string
      }>
      ratings?: {
        "Engagement and Support": string
        "First Time Quality": string
        "On-Time Delivery": string
        "Performance of the Day": string
      }
      shift: string
      country: string | null
    }
  }
  message: string
}

export default function TimesheetViewPage() {
  const [username, setUsername] = useState("")
  const [date, setDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [timesheetData, setTimesheetData] = useState<TimesheetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const formatDate = (inputDate: string) => {
    // Convert from MM-DD-YYYY to YYYY-MM-DD
    if (!inputDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return inputDate // Return as is if not in expected format
    }

    const [month, day, year] = inputDate.split("-")
    return `${year}-${month}-${day}`
  }

  const handleDateSelect = (selectedDate: Date) => {
    // Format as MM-DD-YYYY
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    const year = selectedDate.getFullYear()

    setDate(`${month}-${day}-${year}`)
    setShowCalendar(false)
  }

  // Update the handleSubmit function to handle the new data structure
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTimesheetData(null)

    if (!username || !date) {
      setError("Please enter both username and date")
      return
    }

    if (!date.match(/^\d{2}-\d{2}-\d{4}$/)) {
      setError("Date must be in MM-DD-YYYY format")
      return
    }

    setIsLoading(true)

    try {
      // Log the input data
      console.log("Form submission data:")
      console.log("Username:", username)
      console.log("Date (MM-DD-YYYY):", date)

      // Use the original date format (MM-DD-YYYY)
      const apiUrl = `${API_BASE_URL}/api/timesheet/admin/${username}/${date}`
      console.log("API request URL:", apiUrl)

      const response = await fetch(apiUrl)
      console.log("API response status:", response.status)

      if (!response.ok) {
        if (response.status === 404) {
          console.log("API returned 404 - No timesheet found")
          throw new Error("No timesheet found for this user and date")
        }
        console.log("API returned error status:", response.status)
        throw new Error(`Error fetching timesheet: ${response.status}`)
      }

      const data = await response.json()
      console.log("API response data:", data)
      console.log("API response data type:", typeof data)
      console.log("API response data structure:", JSON.stringify(data, null, 2))

      // Log the new data structure
      if (data.data) {
        console.log("AM data available:", data.data.AM ? data.data.AM.hours.length + " entries" : "None")
        console.log("PM data available:", data.data.PM ? data.data.PM.hours.length + " entries" : "None")
        console.log("AM Shift:", data.data.AM?.shift || "Not specified")
        console.log("PM Shift:", data.data.PM?.shift || "Not specified")
      }

      setTimesheetData(data)
    } catch (error) {
      console.error("Error fetching timesheet:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch timesheet")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch timesheet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate calendar days for current month
  const generateCalendar = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get first day of month and total days in month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const days = []
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className="w-8 h-8 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Helper function to get color class based on progress value
  const getProgressColorClass = (progress: string) => {
    const lowerProgress = progress.toLowerCase()
    if (lowerProgress === "green") return "bg-green-500"
    if (lowerProgress === "yellow") return "bg-yellow-500"
    if (lowerProgress === "red") return "bg-red-500"
    return "bg-gray-500" // Default color
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00FF00]">View Timesheets</h1>
        <p className="text-gray-600">View timesheet entries for any user</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timesheet Lookup</CardTitle>
          <CardDescription>Enter username and date to view timesheet</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
              </div>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <label htmlFor="date" className="text-sm font-medium">
                  Date (MM-DD-YYYY)
                </label>
              </div>
              <div className="flex w-full items-center space-x-2 relative">
                <Input
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="MM-DD-YYYY"
                  pattern="\d{2}-\d{2}-\d{4}"
                  required
                  className="w-full"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="px-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>

                {showCalendar && (
                  <div
                    ref={calendarRef}
                    className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-10 p-2"
                  >
                    <div className="text-center font-medium mb-2">
                      {monthNames[currentMonth]} {currentYear}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {/* Day headers */}
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}

                      {/* Calendar days */}
                      {generateCalendar()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="text-red-500 text-sm py-1">{error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "View Timesheet"
              )}
            </Button>
          </form>

          {timesheetData && (
            <div className="mt-8 border-t pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Timesheet Details</h3>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Username:</span> {username}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {date}
                  </p>
                  {(timesheetData?.data?.AM?.shift || timesheetData?.data?.PM?.shift) && (
                    <p>
                      <span className="font-medium">Shift:</span>{" "}
                      {timesheetData.data.AM?.shift || timesheetData.data.PM?.shift}
                    </p>
                  )}
                </div>
              </div>

              <Tabs defaultValue="am">
                <TabsList>
                  <TabsTrigger value="am">AM</TabsTrigger>
                  <TabsTrigger value="pm">PM</TabsTrigger>
                </TabsList>

                <TabsContent value="am">
                  {timesheetData?.data?.AM?.hours && timesheetData.data.AM.hours.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border px-4 py-2 text-left">Hour</th>
                            <th className="border px-4 py-2 text-left">Task</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timesheetData.data.AM.hours.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="border px-4 py-2">{item.hour}</td>
                              <td className="border px-4 py-2">{item.task}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">No AM timesheet entries found</div>
                  )}
                </TabsContent>

                <TabsContent value="pm">
                  {timesheetData?.data?.PM?.hours && timesheetData.data.PM.hours.length > 0 ? (
                    <div className="space-y-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border px-4 py-2 text-left">Hour</th>
                              <th className="border px-4 py-2 text-left">Task</th>
                              <th className="border px-4 py-2 text-left">Progress</th>
                              <th className="border px-4 py-2 text-left">Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timesheetData.data.PM.hours.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="border px-4 py-2">{item.hour}</td>
                                <td className="border px-4 py-2">{item.task}</td>
                                <td className="border px-4 py-2">
                                  <div className="flex items-center">
                                    {item.progress ? (
                                      <>
                                        <div
                                          className={`w-4 h-4 rounded-full mr-2 ${getProgressColorClass(item.progress)}`}
                                        />
                                        {item.progress}
                                      </>
                                    ) : (
                                      "-"
                                    )}
                                  </div>
                                </td>
                                <td className="border px-4 py-2">{item.comments || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {timesheetData.data.PM.ratings && (
                        <div className="mt-6">
                          <h4 className="text-md font-semibold mb-2">Performance Ratings</h4>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border px-4 py-2 text-left">Category</th>
                                <th className="border px-4 py-2 text-left">Rating</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(timesheetData.data.PM.ratings).map(([category, rating], index) => (
                                <tr key={index} className="border-b">
                                  <td className="border px-4 py-2">{category}</td>
                                  <td className="border px-4 py-2">
                                    <div className="flex items-center">
                                      <div className={`w-4 h-4 rounded-full mr-2 ${getProgressColorClass(rating)}`} />
                                      {rating}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">No PM timesheet entries found</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

