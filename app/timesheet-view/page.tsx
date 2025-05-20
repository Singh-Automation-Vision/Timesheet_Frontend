"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import DatePicker from "@/components/DatePicker"

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

// Safety Matrix Entry Interface
interface SafetyEntry {
  date: string
  employee_name: string
  shift: string
  safety_matrix?: Record<string, string> // Updated from safety_ratings to safety_matrix
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

interface SafetyResponse {
  data: SafetyEntry[]
  message: string
}

export default function TimesheetViewPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"timesheet" | "matrices" | "safety">("timesheet")
  const [timesheetTab, setTimesheetTab] = useState<"am" | "pm">("am")

  // Form states
  const [username, setUsername] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [matrixUsername, setMatrixUsername] = useState("")
  const [matrixStartDate, setMatrixStartDate] = useState("")
  const [matrixEndDate, setMatrixEndDate] = useState("")
  const [safetyUsername, setSafetyUsername] = useState("")
  const [safetyStartDate, setSafetyStartDate] = useState("")
  const [safetyEndDate, setSafetyEndDate] = useState("")

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [isMatrixLoading, setIsMatrixLoading] = useState(false)
  const [isSafetyLoading, setIsSafetyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matrixError, setMatrixError] = useState<string | null>(null)
  const [safetyError, setSafetyError] = useState<string | null>(null)

  // Data states
  const [amData, setAMData] = useState<AMTimesheetResponse | null>(null)
  const [pmData, setPMData] = useState<PMTimesheetResponse | null>(null)
  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null)
  const [safetyData, setSafetyData] = useState<SafetyResponse | null>(null)

  // Toast
  const { toast } = useToast()

  // Pagination states
  const [amCurrentPage, setAMCurrentPage] = useState(0)
  const [pmCurrentPage, setPMCurrentPage] = useState(0)
  const [matrixCurrentPage, setMatrixCurrentPage] = useState(0)
  const [safetyCurrentPage, setSafetyCurrentPage] = useState(0)
  const entriesPerPage = 3

  const formatDateForDisplay = (inputDate: string) => {
    // Return the date in its original format (MM-DD-YYYY)
    if (!inputDate || !inputDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return inputDate // Return as is if not in expected format or empty
    }

    return inputDate // Keep the original MM-DD-YYYY format
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

      let amDataResult = null
      let pmDataResult = null
      let noDataFound = false

      // Process AM response
      if (amResponse.ok) {
        const amResponseData = await amResponse.json()
        console.log("AM API response data:", amResponseData)

        // Check for the specific error message
        if (amResponseData.message === "No data found for the given date range.") {
          console.log("AM API returned no data message")
          noDataFound = true
          // Store the exact message from the API
          setError(amResponseData.message)
        } else {
          amDataResult = amResponseData
          setAMData(amResponseData)
        }
      } else if (amResponse.status === 404) {
        noDataFound = true
      }

      // Process PM response
      if (pmResponse.ok) {
        const pmResponseData = await pmResponse.json()
        console.log("PM API response data:", pmResponseData)

        // Check for the specific error message
        if (pmResponseData.message === "No data found for the given date range.") {
          console.log("PM API returned no data message")
          noDataFound = true
          // Store the exact message from the API
          setError(pmResponseData.message)
        } else {
          pmDataResult = pmResponseData
          setPMData(pmResponseData)
        }
      } else if (pmResponse.status === 404) {
        noDataFound = true
      }

      // Log what data we actually received
      console.log("AM data received:", amDataResult?.data?.length || 0, "entries")
      console.log("PM data received:", pmDataResult?.data?.length || 0, "entries")

      // If both responses indicate no data, show an error
      if (
        ((!amDataResult || amDataResult.data?.length === 0) && (!pmDataResult || pmDataResult.data?.length === 0)) ||
        noDataFound
      ) {
        throw new Error("No timesheet data found for this user and date range")
      }

      // If we got here, at least one of the requests succeeded with data
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

      // Check for the specific error message
      if (data.message === "No data found for the given date range.") {
        setMatrixError(data.message)
        throw new Error(data.message)
      }

      // Check if data is empty
      if (!data.data || data.data.length === 0) {
        throw new Error("No performance matrices found for this user and date range")
      }

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

  const handleSafetySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSafetyError(null)
    setSafetyData(null)
    setSafetyCurrentPage(0)

    if (!safetyUsername || !safetyStartDate || !safetyEndDate) {
      setSafetyError("Please enter username, start date, and end date")
      return
    }

    if (!safetyStartDate.match(/^\d{2}-\d{2}-\d{4}$/) || !safetyEndDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      setSafetyError("Dates must be in MM-DD-YYYY format")
      return
    }

    setIsSafetyLoading(true)

    try {
      console.log("Safety form submission data:")
      console.log("Username:", safetyUsername)
      console.log("Start Date:", safetyStartDate)
      console.log("End Date:", safetyEndDate)

      // Fetch safety data
      const safetyApiUrl = `${API_BASE_URL}/api/safety?employee_name=${safetyUsername}&start_date=${safetyStartDate}&end_date=${safetyEndDate}`
      console.log("Safety API request URL:", safetyApiUrl)
      const safetyResponse = await fetch(safetyApiUrl)

      if (!safetyResponse.ok) {
        if (safetyResponse.status === 404) {
          throw new Error("No safety matrices found for this user and date range")
        }
        throw new Error(`Error fetching safety matrices: ${safetyResponse.status}`)
      }

      const data = await safetyResponse.json()
      console.log("Safety API response data:", data)

      // Check for the specific error message
      if (data.message === "No data found for the given date range.") {
        setSafetyError(data.message)
        throw new Error(data.message)
      }

      // Check if data is empty
      if (!data.data || data.data.length === 0) {
        throw new Error("No safety matrices found for this user and date range")
      }

      setSafetyData(data)
    } catch (error) {
      console.error("Error fetching safety matrices:", error)
      setSafetyError(error instanceof Error ? error.message : "Failed to fetch safety matrices")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch safety matrices",
        variant: "destructive",
      })
    } finally {
      setIsSafetyLoading(false)
    }
  }

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

  // Calculate pagination for safety data
  const safetyTotalEntries = safetyData?.data?.length || 0
  const safetyTotalPages = Math.ceil(safetyTotalEntries / entriesPerPage)
  const safetyStartIndex = safetyCurrentPage * entriesPerPage
  const safetyEndIndex = Math.min(safetyStartIndex + entriesPerPage, safetyTotalEntries)
  const safetyCurrentEntries = safetyData?.data?.slice(safetyStartIndex, safetyEndIndex) || []

  // Handle pagination navigation
  const goToNextPage = (type: "am" | "pm" | "matrix" | "safety") => {
    if (type === "am" && amCurrentPage < amTotalPages - 1) {
      setAMCurrentPage(amCurrentPage + 1)
    } else if (type === "pm" && pmCurrentPage < pmTotalPages - 1) {
      setPMCurrentPage(pmCurrentPage + 1)
    } else if (type === "matrix" && matrixCurrentPage < matrixTotalPages - 1) {
      setMatrixCurrentPage(matrixCurrentPage + 1)
    } else if (type === "safety" && safetyCurrentPage < safetyTotalPages - 1) {
      setSafetyCurrentPage(safetyCurrentPage + 1)
    }
  }

  const goToPrevPage = (type: "am" | "pm" | "matrix" | "safety") => {
    if (type === "am" && amCurrentPage > 0) {
      setAMCurrentPage(amCurrentPage - 1)
    } else if (type === "pm" && pmCurrentPage > 0) {
      setPMCurrentPage(pmCurrentPage - 1)
    } else if (type === "matrix" && matrixCurrentPage > 0) {
      setMatrixCurrentPage(matrixCurrentPage - 1)
    } else if (type === "safety" && safetyCurrentPage > 0) {
      setSafetyCurrentPage(safetyCurrentPage - 1)
    }
  }

  // Download as PDF
  const handleDownloadPDF = (type: "am" | "pm" | "matrix" | "safety") => {
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
      } else if (type === "safety") {
        if (!safetyData || !safetyData.data || safetyData.data.length === 0) {
          toast({
            title: "Error",
            description: "No safety data available to download",
            variant: "destructive",
          })
          return
        }

        doc.text(`Safety Matrices Report for ${safetyUsername}`, 14, 20)
        doc.setFontSize(12)
        doc.text(`Date Range: ${safetyStartDate} to ${safetyEndDate}`, 14, 30)

        let yPos = 40

        // Process each safety entry
        safetyData.data.forEach((entry, index) => {
          // Add date header
          doc.setFontSize(14)
          doc.text(`Date: ${formatDateForDisplay(entry.date || "")}`, 14, yPos)
          yPos += 10

          // Add employee info
          doc.setFontSize(12)
          doc.text(`Employee: ${entry.employee_name}`, 14, yPos)
          yPos += 7

          if (entry.shift) {
            doc.text(`Shift: ${entry.shift}`, 14, yPos)
            yPos += 10
          }

          if (entry.safety_matrix && Object.keys(entry.safety_matrix).length > 0) {
            const tableData = Object.entries(entry.safety_matrix).map(([question, rating]) => [question, rating])

            autoTable(doc, {
              startY: yPos,
              head: [["Question", "Rating"]],
              body: tableData,
            })

            yPos = (doc as any).lastAutoTable.finalY + 10

            // Add red count if safety_matrix exists
            doc.setFontSize(12)
            const redCount = calculateRedCount(entry.safety_matrix)
            doc.text(`Red Count: ${redCount}`, 14, yPos)
            yPos += 10
          } else {
            // If no safety_matrix, just show the basic info
            yPos += 10
            doc.setFontSize(12)
            doc.text("No detailed safety ratings available for this date", 14, yPos)
            yPos += 10
          }

          // Add page break if not the last entry
          if (index < safetyData.data.length - 1) {
            doc.addPage()
            yPos = 20
          }
        })

        // Save the PDF
        doc.save(`${safetyUsername}_safety_matrices_${safetyStartDate}_to_${safetyEndDate}.pdf`)
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
        <p className="text-gray-600">View timesheet entries, performance matrices, and safety matrices</p>
      </div>

      <Tabs
        defaultValue="timesheet"
        onValueChange={(value) => setActiveTab(value as "timesheet" | "matrices" | "safety")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="timesheet">Timesheet Lookup</TabsTrigger>
          <TabsTrigger value="matrices">Performance Matrices</TabsTrigger>
          <TabsTrigger value="safety">Safety Matrices</TabsTrigger>
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
                  <DatePicker value={startDate} onChange={setStartDate} label="Start Date (MM-DD-YYYY)" />

                  {/* End Date */}
                  <DatePicker value={endDate} onChange={setEndDate} label="End Date (MM-DD-YYYY)" />
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
                  <DatePicker value={matrixStartDate} onChange={setMatrixStartDate} label="Start Date (MM-DD-YYYY)" />

                  {/* End Date */}
                  <DatePicker value={matrixEndDate} onChange={setMatrixEndDate} label="End Date (MM-DD-YYYY)" />
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

        {/* Safety Matrices Tab */}
        <TabsContent value="safety">
          <Card>
            <CardHeader>
              <CardTitle>Safety Matrices Lookup</CardTitle>
              <CardDescription>Enter username and date range to view safety matrices</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSafetySubmit} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <label htmlFor="safetyUsername" className="text-sm font-medium">
                      Username
                    </label>
                  </div>
                  <Input
                    id="safetyUsername"
                    value={safetyUsername}
                    onChange={(e) => setSafetyUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <DatePicker value={safetyStartDate} onChange={setSafetyStartDate} label="Start Date (MM-DD-YYYY)" />

                  {/* End Date */}
                  <DatePicker value={safetyEndDate} onChange={setSafetyEndDate} label="End Date (MM-DD-YYYY)" />
                </div>

                {safetyError && <div className="text-red-500 text-sm py-1">{safetyError}</div>}

                <Button type="submit" disabled={isSafetyLoading} className="w-full">
                  {isSafetyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "View Safety Matrices"
                  )}
                </Button>
              </form>

              {safetyData?.data?.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Safety Matrices</h3>
                    <Button
                      onClick={() => handleDownloadPDF("safety")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Safety Matrices
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600 mb-4">
                    <p>
                      <span className="font-medium">Username:</span> {safetyUsername}
                    </p>
                    <p>
                      <span className="font-medium">Date Range:</span> {safetyStartDate} to {safetyEndDate}
                    </p>
                    <p>
                      <span className="font-medium">Showing:</span> {safetyStartIndex + 1}-{safetyEndIndex} of{" "}
                      {safetyTotalEntries} entries
                    </p>
                  </div>

                  <div className="space-y-6">
                    {safetyCurrentEntries.map((entry, entryIndex) => (
                      <div key={entryIndex} className="mb-8 border rounded-md p-4">
                        <h4 className="text-md font-semibold mb-4">Date: {formatDateForDisplay(entry.date || "")}</h4>

                        <div className="mb-4">
                          <p className="text-sm">
                            <span className="font-medium">Employee:</span> {entry.employee_name}
                          </p>
                          {entry.shift && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Shift:</span> {entry.shift}
                            </p>
                          )}
                        </div>

                        {entry.safety_matrix && Object.keys(entry.safety_matrix).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border px-4 py-2 text-left">Question</th>
                                  <th className="border px-4 py-2 text-left">Rating</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(entry.safety_matrix).map(([question, rating], index) => (
                                  <tr key={index} className="border-b">
                                    <td className="border px-4 py-2">{question}</td>
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
                                <span className="text-red-500">{calculateRedCount(entry.safety_matrix)}</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-gray-500">
                            Basic safety data available. No detailed ratings found for this date.
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination controls for Safety */}
                    {safetyTotalPages > 1 && (
                      <div className="flex justify-center items-center mt-6 space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPrevPage("safety")}
                          disabled={safetyCurrentPage === 0}
                          className="flex items-center"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {safetyCurrentPage + 1} of {safetyTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToNextPage("safety")}
                          disabled={safetyCurrentPage === safetyTotalPages - 1}
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
