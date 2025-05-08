"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, CalendarIcon, User } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import DatePicker from "@/components/DatePicker"

interface UserDetails {
  name: string
  designation: string
}

interface ProjectHours {
  project_name: string
  hours: number
}

interface UserProjectData {
  user_details: UserDetails
  projects: ProjectHours[]
  total_hours: number
}

interface UserViewProps {
  onBack: () => void
}

export default function UserView({ onBack }: UserViewProps) {
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userData, setUserData] = useState<UserProjectData | null>(null)
  const [users, setUsers] = useState<Array<{ name: string; email: string; designation?: string }>>([])
  const { toast } = useToast()

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/timesheet/showUser`)

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const usersData = data.data || []

        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [toast])

  const fetchUserProjectData = async () => {
    if (!selectedUser || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select a user and date range",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Find the selected user's name from the users array
      const selectedUserObj = users.find((user) => user.email === selectedUser)
      if (!selectedUserObj) {
        throw new Error("Selected user not found")
      }

      const userName = selectedUserObj.name

      // Add detailed logging of the request parameters
      console.log("Fetching user project data with parameters:")
      console.log("Selected User Email:", selectedUser)
      console.log("Selected User Name:", userName)
      console.log("Start Date:", startDate)
      console.log("End Date:", endDate)

      // Construct the API URL with the user's name and dates
      const apiUrl = `${API_BASE_URL}/api/users/${encodeURIComponent(userName)}/projects/${startDate}/${endDate}`

      console.log("Full API URL:", apiUrl)
      console.log("API Base URL:", API_BASE_URL)
      console.log("Request data being sent:", { user: userName, startDate, endDate })

      const response = await fetch(apiUrl)
      const responseText = await response.text() // Get response as text first for debugging
      console.log("Raw API response:", responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
        console.log("Parsed response data:", responseData)
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        throw new Error(`API returned error status: ${response.status} ${response.statusText}`)
      }

      // Handle different response structures
      if (responseData.success === false) {
        throw new Error(responseData.error || "API returned success: false")
      }

      // Try to extract the data regardless of the exact structure
      const data = responseData.data || responseData

      // Validate the data structure
      if (!data || (!data.user_details && !data.projects)) {
        console.error("Unexpected data structure:", data)
        throw new Error("Received data in unexpected format")
      }

      console.log("Final data being used:", data)
      setUserData(data)
    } catch (error) {
      console.error("Error fetching user project data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load user project data. Please try again.",
        variant: "destructive",
      })
      setUserData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString || !dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString || "N/A" // Return as is if not in expected format or empty
    }

    try {
      // Parse MM-DD-YYYY format
      const [month, day, year] = dateString.split("-").map(Number)
      const date = new Date(year, month - 1, day)

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return dateString // Return the original string if parsing fails
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">View User Project Details</h2>
      </div>

      <div className="space-y-6">
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-auto">
              {users.map((user) => (
                <SelectItem key={user.email} value={user.email}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Start Date */}
          <DatePicker value={startDate} onChange={setStartDate} label="Start Date (MM-DD-YYYY)" />

          {/* End Date */}
          <DatePicker value={endDate} onChange={setEndDate} label="End Date (MM-DD-YYYY)" />
        </div>

        <div className="mt-4">
          <Button
            onClick={fetchUserProjectData}
            disabled={!selectedUser || !startDate || !endDate || isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "View Details"
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userData ? (
          <Card>
            <CardHeader>
              <CardTitle>User Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Employee Name</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="text-lg font-medium">{userData.user_details.name}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Designation</h3>
                  <p className="text-lg font-medium mt-1">{userData.user_details.designation || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <p className="text-base">
                      {formatDate(startDate)} to {formatDate(endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Project Contributions</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Project</TableHead>
                        <TableHead className="text-right font-bold">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.projects && userData.projects.length > 0 ? (
                        userData.projects.map((project, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{project.project_name}</TableCell>
                            <TableCell className="text-right">{project.hours}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                            No project contributions found for this date range
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-bold">Total Hours</TableCell>
                        <TableCell className="text-right font-bold">{userData.total_hours}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedUser ? (
          <div className="text-center py-8 text-gray-500">
            Select a date range and click "View Details" to see user project data
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Select a user to view project details</div>
        )}
      </div>
    </div>
  )
}
