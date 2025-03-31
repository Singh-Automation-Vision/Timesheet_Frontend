"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CalendarIcon, User, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// AM Timesheet Entry Interface
interface AMEntry {
  date: string
  employee_name: string
  hours: Array<{
    hour: string
    task: string
  }>
  shift: string
}

// PM Timesheet Entry Interface
interface PMEntry {
  date: string
  employee_name: string
  hours: Array<{
    hour: string
    task: string
    progress: string
    comments: string
    projectName?: string
    projects?: Record<string, string> // Add support for the new projects structure
  }>
  shift: string
  country: string | null
}

// Performance Matrix Entry Interface
interface MatrixEntry {
  date: string
  employee_name: string
  ratings: {
    "Engagement and Support": string
    "First Time Quality": string
    "On-Time Delivery": string
    "Performance of the Day": string
  }
  red_count?: number
}

// API Response Interfaces
interface AMTimesheetResponse {
  data: AMEntry[]
  message: string
}

interface PMTimesheetResponse {
  data: PMEntry[]
  message: string
}

interface MatrixResponse {
  data: MatrixEntry[]
  message: string
}

export default function TimesheetViewPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"timesheet" | "matrices">("timesheet")
  const [timesheetTab, setTimesheetTab] = useState<"am" | "pm">("am")

  // Form states
  const [username, setUsername] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [matrixUsername, setMatrixUsername] = useState("")
  const [matrixStartDate, setMatrixStartDate] = useState("")
  const [matrixEndDate, setMatrixEndDate] = useState("")

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [isMatrixLoading, setIsMatrixLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  // Data states
  const [amData, setAMData] = useState<AMTimesheetResponse | null>(null)
  const [pmData, setPMData] = useState<PMTimesheetResponse | null>(null)
  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null)

  // Calendar states
  const [showStartCalendar, setShowStartCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)
  const [showMatrixStartCalendar, setShowMatrixStartCalendar] = useState(false)
  const [showMatrixEndCalendar, setShowMatrixEndCalendar] = useState(false)

  // Refs
  const startCalendarRef = useRef<HTMLDivElement>(null)
  const endCalendarRef = useRef<HTMLDivElement>(null)
  const matrixStartCalendarRef = useRef<HTMLDivElement>(null)
  const matrixEndCalendarRef = useRef<HTMLDivElement>(null)

  // Toast
  const { toast } = useToast()

  // Pagination states
  const [amCurrentPage, setAMCurrentPage] = useState(0)
  const [pmCurrentPage, setPMCurrentPage] = useState(0)
  const [matrixCurrentPage, setMatrixCurrentPage] = useState(0)
  const entriesPerPage = 3

  // Close calendars when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (startCalendarRef.current && !startCalendarRef.current.contains(event.target as Node)) {
        setShowStartCalendar(false)
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(event.target as Node)) {
        setShowEndCalendar(false)
      }
      if (matrixStartCalendarRef.current && !matrixStartCalendarRef.current.contains(event.target as Node)) {
        setShowMatrixStartCalendar(false)
      }
      if (matrixEndCalendarRef.current && !matrixEndCalendarRef.current.contains(event.target as Node)) {
        setShowMatrixEndCalendar(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const formatDateForDisplay = (inputDate: string) => {
    // Return the date in its original format (MM-DD-YYYY)
    if (!inputDate || !inputDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return inputDate // Return as is if not in expected format or empty
    }

    return inputDate // Keep the original MM-DD-YYYY format
  }

  const handleDateSelect = (
    selectedDate: Date,
    setDateFn: React.Dispatch<React.SetStateAction<string>>,
    setShowCalendarFn: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    // Format as MM-DD-YYYY
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    const year = selectedDate.getFullYear()

    setDateFn(`${month}-${day}-${year}`)
    setShowCalendarFn(false)
  }

  const handleTimesheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAMData(null)
    setPMData(null)
    setAMCurrentPage(0)
    setPMCurrentPage(0)

    if (!username || !startDate || !endDate) {
      setError("Please enter username, start date, and end date")
      return
    }

    if (!startDate.match(/^\d{2}-\d{2}-\d{4}$/) || !endDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      setError("Dates must be in MM-DD-YYYY format")
      return
    }

    setIsLoading(true)

    try {
      console.log("Form submission data:")
      console.log("Username:", username)
      console.log("Start Date:", startDate)
      console.log("End Date:", endDate)

      // Fetch AM data
      const amApiUrl = `${API_BASE_URL}/api/timesheet/am/${username}/${startDate}/${endDate}`
      console.log("AM API request URL:", amApiUrl)
      const amResponse = await fetch(amApiUrl)

      // Fetch PM data
      const pmApiUrl = `${API_BASE_URL}/api/timesheet/pm/${username}/${startDate}/${endDate}`
      console.log("PM API request URL:", pmApiUrl)
      const pmResponse = await fetch(pmApiUrl)

      if (!amResponse.ok && !pmResponse.ok) {
        if (amResponse.status === 404 && pmResponse.status === 404) {
          throw new Error("No timesheet found for this user and date range")
        }
        throw new Error(`Error fetching timesheet data`)
      }

      if (amResponse.ok) {
        const amData = await amResponse.json()
        console.log("AM API response data:", amData)
        setAMData(amData)
      }

      if (pmResponse.ok) {
        const pmData = await pmResponse.json()
        console.log("PM API response data:", pmData)
        setPMData(pmData)
      }

      // Log what data we actually received
      console.log("AM data received:", amData?.data?.length || 0, "entries")
      console.log("PM data received:", pmData?.data?.length || 0, "entries")

      // Only show error if both AM and PM requests failed with 404
      if (amResponse.status === 404 && pmResponse.status === 404) {
        throw new Error("No timesheet data found for this user and date range")
      }

      // If we got here, at least one of the requests succeeded or failed with a different error
      // We'll display whatever data we have (if any)
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

  // Helper function to calculate red count from ratings
  const calculateRedCount = (ratings: Record<string, string>): number => {
    return Object.values(ratings).filter((rating) => rating.toLowerCase() === "red").length
  }

  const handleMatrixSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMatrixError(null)
    setMatrixData(null)
    setMatrixCurrentPage(0)

    if (!matrixUsername || !matrixStartDate || !matrixEndDate) {
      setMatrixError("Please enter username, start date, and end date")
      return
    }

    if (!matrixStartDate.match(/^\d{2}-\d{2}-\d{4}$/) || !matrixEndDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      setMatrixError("Dates must be in MM-DD-YYYY format")
      return
    }

    setIsMatrixLoading(true)

    try {
      console.log("Matrix form submission data:")
      console.log("Username:", matrixUsername)
      console.log("Start Date:", matrixStartDate)
      console.log("End Date:", matrixEndDate)

      // Fetch matrix data
      const matrixApiUrl = `${API_BASE_URL}/api/matrices/${matrixUsername}/${matrixStartDate}/${matrixEndDate}`
      console.log("Matrix API request URL:", matrixApiUrl)
      const matrixResponse = await fetch(matrixApiUrl)

      if (!matrixResponse.ok) {
        if (matrixResponse.status === 404) {
          throw new Error("No performance matrices found for this user and date range")
        }
        throw new Error(`Error fetching performance matrices: ${matrixResponse.status}`)
      }

      const data = await matrixResponse.json()
      console.log("Matrix API response data:", data)
      setMatrixData(data)
    } catch (error) {
      console.error("Error fetching performance matrices:", error)
      setMatrixError(error instanceof Error ? error.message : "Failed to fetch performance matrices")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch performance matrices",
        variant: "destructive",
      })
    } finally {
      setIsMatrixLoading(false)
    }
  }

  // Generate calendar days for current month
  const generateCalendar = (selectedMonth = new Date().getMonth(), selectedYear = new Date().getFullYear()) => {
    const currentMonth = selectedMonth
    const currentYear = selectedYear

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
          onClick={() => {
            if (showStartCalendar) {
              handleDateSelect(date, setStartDate, setShowStartCalendar)
            } else if (showEndCalendar) {
              handleDateSelect(date, setEndDate, setShowEndCalendar)
            } else if (showMatrixStartCalendar) {
              handleDateSelect(date, setMatrixStartDate, setShowMatrixStartCalendar)
            } else if (showMatrixEndCalendar) {
              handleDateSelect(date, setMatrixEndDate, setShowMatrixEndCalendar)
            }
          }}
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

  // Helper function to format projects for display
  const formatProjects = (item: any) => {
    // Check if we have the new projects structure
    if (item.projects && typeof item.projects === "object") {
      const projectValues = Object.values(item.projects)
      if (projectValues.length > 0) {
        return projectValues.join(", ")
      }
    }

    // Fallback to the old projectName field
    return item.projectName || "-"
  }

  // Helper function to get projects for PDF export
  const getProjectsForPDF = (item: any) => {
    if (item.projects && typeof item.projects === "object") {
      const projectValues = Object.values(item.projects)
      if (projectValues.length > 0) {
        return projectValues.join(", ")
      }
    }
    return item.projectName || "-"
  }

  // Calculate pagination for AM data
  const amTotalEntries = amData?.data?.length || 0
  const amTotalPages = Math.ceil(amTotalEntries / entriesPerPage)
  const amStartIndex = amCurrentPage * entriesPerPage
  const amEndIndex = Math.min(amStartIndex + entriesPerPage, amTotalEntries)
  const amCurrentEntries = amData?.data?.slice(amStartIndex, amEndIndex) || []

  // Calculate pagination for PM data
  const pmTotalEntries = pmData?.data?.length || 0
  const pmTotalPages = Math.ceil(pmTotalEntries / entriesPerPage)
  const pmStartIndex = pmCurrentPage * entriesPerPage
  const pmEndIndex = Math.min(pmStartIndex + entriesPerPage, pmTotalEntries)
  const pmCurrentEntries = pmData?.data?.slice(pmStartIndex, pmEndIndex) || []

  // Calculate pagination for matrix data
  const matrixTotalEntries = matrixData?.data?.length || 0
  const matrixTotalPages = Math.ceil(matrixTotalEntries / entriesPerPage)
  const matrixStartIndex = matrixCurrentPage * entriesPerPage
  const matrixEndIndex = Math.min(matrixStartIndex + entriesPerPage, matrixTotalEntries)
  const matrixCurrentEntries = matrixData?.data?.slice(matrixStartIndex, matrixEndIndex) || []

  // Handle pagination navigation
  const goToNextPage = (type: "am" | "pm" | "matrix") => {
    if (type === "am" && amCurrentPage < amTotalPages - 1) {
      setAMCurrentPage(amCurrentPage + 1)
    } else if (type === "pm" && pmCurrentPage < pmTotalPages - 1) {
      setPMCurrentPage(pmCurrentPage + 1)
    } else if (type === "matrix" && matrixCurrentPage < matrixTotalPages - 1) {
      setMatrixCurrentPage(matrixCurrentPage + 1)
    }
  }

  const goToPrevPage = (type: "am" | "pm" | "matrix") => {
    if (type === "am" && amCurrentPage > 0) {
      setAMCurrentPage(amCurrentPage - 1)
    } else if (type === "pm" && pmCurrentPage > 0) {
      setPMCurrentPage(pmCurrentPage - 1)
    } else if (type === "matrix" && matrixCurrentPage > 0) {
      setMatrixCurrentPage(matrixCurrentPage - 1)
    }
  }

  // Download as PDF
  const handleDownloadPDF = (type: "am" | "pm" | "matrix") => {
    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(18)

      if (type === "am") {
        if (!amData || !amData.data || amData.data.length === 0) {
          toast({
            title: "Error",
            description: "No AM data available to download",
            variant: "destructive",
          })
          return
        }

        doc.text(`AM Timesheet Report for ${username}`, 14, 20)
        doc.setFontSize(12)
        doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30)

        let yPos = 40

        // Process each AM entry
        amData.data.forEach((entry, index) => {
          // Add date header
          doc.setFontSize(14)
          doc.text(`Date: ${formatDateForDisplay(entry.date || "")}`, 14, yPos)
          yPos += 10

          if (entry.hours && entry.hours.length > 0) {
            const tableData = entry.hours.map((item) => [item.hour, item.task])

            autoTable(doc, {
              startY: yPos,
              head: [["Hour", "Task"]],
              body: tableData,
            })

            yPos = (doc as any).lastAutoTable.finalY + 10
          } else {
            doc.setFontSize(12)
            doc.text("No AM timesheet entries found for this date", 14, yPos)
            yPos += 10
          }

          // Add page break if not the last entry
          if (index < amData.data.length - 1) {
            doc.addPage()
            yPos = 20
          }
        })

        // Save the PDF
        doc.save(`${username}_AM_timesheet_${startDate}_to_${endDate}.pdf`)
      } else if (type === "pm") {
        if (!pmData || !pmData.data || pmData.data.length === 0) {
          toast({
            title: "Error",
            description: "No PM data available to download",
            variant: "destructive",
          })
          return
        }

        doc.text(`PM Timesheet Report for ${username}`, 14, 20)
        doc.setFontSize(12)
        doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30)

        let yPos = 40

        // Process each PM entry
        pmData.data.forEach((entry, index) => {
          // Add date header
          doc.setFontSize(14)
          doc.text(`Date: ${formatDateForDisplay(entry.date || "")}`, 14, yPos)
          yPos += 10

          if (entry.hours && entry.hours.length > 0) {
            const tableData = entry.hours.map((item) => [
              item.hour,
              item.task,
              getProjectsForPDF(item),
              item.progress || "-",
              item.comments || "-",
            ])

            autoTable(doc, {
              startY: yPos,
              head: [["Hour", "Task", "Projects", "Progress", "Comments"]],
              body: tableData,
            })

            yPos = (doc as any).lastAutoTable.finalY + 10
          } else {
            doc.setFontSize(12)
            doc.text("No PM timesheet entries found for this date", 14, yPos)
            yPos += 10
          }

          // Add page break if not the last entry
          if (index < pmData.data.length - 1) {
            doc.addPage()
            yPos = 20
          }
        })

        // Save the PDF
        doc.save(`${username}_PM_timesheet_${startDate}_to_${endDate}.pdf`)
      } else if (type === "matrix") {
        if (!matrixData || !matrixData.data || matrixData.data.length === 0) {
          toast({
            title: "Error",
            description: "No matrix data available to download",
            variant: "destructive",
          })
          return
        }

        doc.text(`Performance Matrices Report for ${matrixUsername}`, 14, 20)
        doc.setFontSize(12)
        doc.text(`Date Range: ${matrixStartDate} to ${matrixEndDate}`, 14, 30)

        let yPos = 40

        // Process each matrix entry
        matrixData.data.forEach((entry, index) => {
          // Add date header
          doc.setFontSize(14)
          doc.text(`Date: ${formatDateForDisplay(entry.date || "")}`, 14, yPos)
          yPos += 10

          if (entry.ratings) {
            const tableData = Object.entries(entry.ratings).map(([category, rating]) => [category, rating])

            autoTable(doc, {
              startY: yPos,
              head: [["Category", "Rating"]],
              body: tableData,
            })

            yPos = (doc as any).lastAutoTable.finalY + 10

            // Add red count
            doc.setFontSize(12)
            const redCount = entry.red_count !== undefined ? entry.red_count : calculateRedCount(entry.ratings)
            doc.text(`Red Count: ${redCount}`, 14, yPos)
            yPos += 10
          } else {
            doc.setFontSize(12)
            doc.text("No performance matrix data found for this date", 14, yPos)
            yPos += 10
          }

          // Add page break if not the last entry
          if (index < matrixData.data.length - 1) {
            doc.addPage()
            yPos = 20
          }
        })

        // Save the PDF
        doc.save(`${matrixUsername}_performance_matrices_${matrixStartDate}_to_${matrixEndDate}.pdf`)
      }

      toast({
        title: "Success",
        description: "Data downloaded as PDF",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00FF00]">Performance Tracker</h1>
        <p className="text-gray-600">View timesheet entries and performance matrices</p>
      </div>

      <Tabs defaultValue="timesheet" onValueChange={(value) => setActiveTab(value as "timesheet" | "matrices")}>
        <TabsList className="mb-4">
          <TabsTrigger value="timesheet">Timesheet Lookup</TabsTrigger>
          <TabsTrigger value="matrices">Performance Matrices</TabsTrigger>
        </TabsList>

        {/* Timesheet Lookup Tab */}
        <TabsContent value="timesheet">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Lookup</CardTitle>
              <CardDescription>Enter username and date range to view timesheets</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTimesheetSubmit} className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <label htmlFor="startDate" className="text-sm font-medium">
                        Start Date (MM-DD-YYYY)
                      </label>
                    </div>
                    <div className="flex w-full items-center space-x-2 relative">
                      <Input
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="MM-DD-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                        className="w-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShowStartCalendar(!showStartCalendar)
                          setShowEndCalendar(false)
                        }}
                        className="px-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>

                      {showStartCalendar && (
                        <div
                          ref={startCalendarRef}
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

                  {/* End Date */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <label htmlFor="endDate" className="text-sm font-medium">
                        End Date (MM-DD-YYYY)
                      </label>
                    </div>
                    <div className="flex w-full items-center space-x-2 relative">
                      <Input
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="MM-DD-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                        className="w-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShowEndCalendar(!showEndCalendar)
                          setShowStartCalendar(false)
                        }}
                        className="px-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>

                      {showEndCalendar && (
                        <div
                          ref={endCalendarRef}
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
                </div>

                {error && <div className="text-red-500 text-sm py-1">{error}</div>}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "View Timesheets"
                  )}
                </Button>
              </form>

              {(amData?.data?.length > 0 || pmData?.data?.length > 0) && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Timesheet Details</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600 mb-4">
                    <p>
                      <span className="font-medium">Username:</span> {username}
                    </p>
                    <p>
                      <span className="font-medium">Date Range:</span> {startDate} to {endDate}
                    </p>
                  </div>

                  <Tabs defaultValue="am" onValueChange={(value) => setTimesheetTab(value as "am" | "pm")}>
                    <TabsList>
                      <TabsTrigger value="am">AM Sheets</TabsTrigger>
                      <TabsTrigger value="pm">PM Sheets</TabsTrigger>
                    </TabsList>

                    {/* AM Sheets Tab */}
                    <TabsContent value="am">
                      {amData?.data?.length > 0 ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                              Showing {amStartIndex + 1}-{amEndIndex} of {amTotalEntries} entries
                            </p>
                            <Button
                              onClick={() => handleDownloadPDF("am")}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download AM Sheets
                            </Button>
                          </div>

                          {amCurrentEntries.map((entry, entryIndex) => (
                            <div key={entryIndex} className="mb-8 border rounded-md p-4">
                              <h4 className="text-md font-semibold mb-4">
                                Date: {formatDateForDisplay(entry.date || "")}
                              </h4>

                              {entry.hours && entry.hours.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="border px-4 py-2 text-left">Hour</th>
                                        <th className="border px-4 py-2 text-left">Task</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entry.hours.map((item, index) => (
                                        <tr key={index} className="border-b">
                                          <td className="border px-4 py-2">{item.hour}</td>
                                          <td className="border px-4 py-2">{item.task}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="py-4 text-center text-gray-500">
                                  No AM timesheet entries found for this date
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Pagination controls for AM */}
                          {amTotalPages > 1 && (
                            <div className="flex justify-center items-center mt-6 space-x-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPrevPage("am")}
                                disabled={amCurrentPage === 0}
                                className="flex items-center"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                              </Button>
                              <span className="text-sm">
                                Page {amCurrentPage + 1} of {amTotalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToNextPage("am")}
                                disabled={amCurrentPage === amTotalPages - 1}
                                className="flex items-center"
                              >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          No AM timesheet entries found for this date range
                        </div>
                      )}
                    </TabsContent>

                    {/* PM Sheets Tab */}
                    <TabsContent value="pm">
                      {pmData?.data?.length > 0 ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                              Showing {pmStartIndex + 1}-{pmEndIndex} of {pmTotalEntries} entries
                            </p>
                            <Button
                              onClick={() => handleDownloadPDF("pm")}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download PM Sheets
                            </Button>
                          </div>

                          {pmCurrentEntries.map((entry, entryIndex) => (
                            <div key={entryIndex} className="mb-8 border rounded-md p-4">
                              <h4 className="text-md font-semibold mb-4">
                                Date: {formatDateForDisplay(entry.date || "")}
                              </h4>

                              {entry.hours && entry.hours.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="border px-4 py-2 text-left">Hour</th>
                                        <th className="border px-4 py-2 text-left">Task</th>
                                        <th className="border px-4 py-2 text-left">Projects</th>
                                        <th className="border px-4 py-2 text-left">Progress</th>
                                        <th className="border px-4 py-2 text-left">Comments</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entry.hours.map((item, index) => (
                                        <tr key={index} className="border-b">
                                          <td className="border px-4 py-2">{item.hour}</td>
                                          <td className="border px-4 py-2 whitespace-pre-wrap break-words">
                                            {item.task}
                                          </td>
                                          <td className="border px-4 py-2">{formatProjects(item)}</td>
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
                              ) : (
                                <div className="py-4 text-center text-gray-500">
                                  No PM timesheet entries found for this date
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Pagination controls for PM */}
                          {pmTotalPages > 1 && (
                            <div className="flex justify-center items-center mt-6 space-x-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPrevPage("pm")}
                                disabled={pmCurrentPage === 0}
                                className="flex items-center"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                              </Button>
                              <span className="text-sm">
                                Page {pmCurrentPage + 1} of {pmTotalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToNextPage("pm")}
                                disabled={pmCurrentPage === pmTotalPages - 1}
                                className="flex items-center"
                              >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          No PM timesheet entries found for this date range
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Matrices Tab */}
        <TabsContent value="matrices">
          <Card>
            <CardHeader>
              <CardTitle>Performance Matrices Lookup</CardTitle>
              <CardDescription>Enter username and date range to view performance matrices</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMatrixSubmit} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <label htmlFor="matrixUsername" className="text-sm font-medium">
                      Username
                    </label>
                  </div>
                  <Input
                    id="matrixUsername"
                    value={matrixUsername}
                    onChange={(e) => setMatrixUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <label htmlFor="matrixStartDate" className="text-sm font-medium">
                        Start Date (MM-DD-YYYY)
                      </label>
                    </div>
                    <div className="flex w-full items-center space-x-2 relative">
                      <Input
                        id="matrixStartDate"
                        value={matrixStartDate}
                        onChange={(e) => setMatrixStartDate(e.target.value)}
                        placeholder="MM-DD-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                        className="w-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShowMatrixStartCalendar(!showMatrixStartCalendar)
                          setShowMatrixEndCalendar(false)
                        }}
                        className="px-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>

                      {showMatrixStartCalendar && (
                        <div
                          ref={matrixStartCalendarRef}
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

                  {/* End Date */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <label htmlFor="matrixEndDate" className="text-sm font-medium">
                        End Date (MM-DD-YYYY)
                      </label>
                    </div>
                    <div className="flex w-full items-center space-x-2 relative">
                      <Input
                        id="matrixEndDate"
                        value={matrixEndDate}
                        onChange={(e) => setMatrixEndDate(e.target.value)}
                        placeholder="MM-DD-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                        className="w-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShowMatrixEndCalendar(!showMatrixEndCalendar)
                          setShowMatrixStartCalendar(false)
                        }}
                        className="px-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>

                      {showMatrixEndCalendar && (
                        <div
                          ref={matrixEndCalendarRef}
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
                </div>

                {matrixError && <div className="text-red-500 text-sm py-1">{matrixError}</div>}

                <Button type="submit" disabled={isMatrixLoading} className="w-full">
                  {isMatrixLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "View Performance Matrices"
                  )}
                </Button>
              </form>

              {matrixData?.data?.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Performance Matrices</h3>
                    <Button
                      onClick={() => handleDownloadPDF("matrix")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Matrices
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600 mb-4">
                    <p>
                      <span className="font-medium">Username:</span> {matrixUsername}
                    </p>
                    <p>
                      <span className="font-medium">Date Range:</span> {matrixStartDate} to {matrixEndDate}
                    </p>
                    <p>
                      <span className="font-medium">Showing:</span> {matrixStartIndex + 1}-{matrixEndIndex} of{" "}
                      {matrixTotalEntries} entries
                    </p>
                  </div>

                  <div className="space-y-6">
                    {matrixCurrentEntries.map((entry, entryIndex) => (
                      <div key={entryIndex} className="mb-8 border rounded-md p-4">
                        <h4 className="text-md font-semibold mb-4">Date: {formatDateForDisplay(entry.date || "")}</h4>

                        {entry.ratings ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border px-4 py-2 text-left">Category</th>
                                  <th className="border px-4 py-2 text-left">Rating</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(entry.ratings).map(([category, rating], index) => (
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
                            <div className="mt-4">
                              <p className="font-medium">
                                Red Count:{" "}
                                <span className="text-red-500">
                                  {entry.red_count !== undefined ? entry.red_count : calculateRedCount(entry.ratings)}
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-gray-500">
                            No performance matrix data found for this date
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination controls for Matrix */}
                    {matrixTotalPages > 1 && (
                      <div className="flex justify-center items-center mt-6 space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPrevPage("matrix")}
                          disabled={matrixCurrentPage === 0}
                          className="flex items-center"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {matrixCurrentPage + 1} of {matrixTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToNextPage("matrix")}
                          disabled={matrixCurrentPage === matrixTotalPages - 1}
                          className="flex items-center"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

