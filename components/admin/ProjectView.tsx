"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, CalendarIcon } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import DatePicker from "@/components/DatePicker"

interface Project {
  id?: string
  projectNumber: string
  projectName: string
  startDate: string
  endDate: string
}

interface ProjectMember {
  employee_name: string
  designation: string
  hours: number
}

interface ProjectDetails {
  project: Project
  members: ProjectMember[]
  total_hours?: number
}

export default function ProjectView({ onBack }: { onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const { toast } = useToast()

  // Date state
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch projects list
  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`)

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Projects data received:", data)

      // Handle different response formats
      if (Array.isArray(data)) {
        setProjects(data)
      } else if (data.success && Array.isArray(data.data)) {
        setProjects(data.data)
      } else if (data.projectNumber && data.projectName) {
        setProjects([data])
      } else {
        console.error("Invalid projects data format:", data)
        throw new Error("Invalid data format received from server")
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProjects(false)
    }
  }

  // Fetch project details
  const fetchProjectDetails = async (projectId: string) => {
    if (!projectId) return

    setIsLoading(true)
    try {
      // Find the selected project from the projects list
      const selectedProject = projects.find(
        (p) => p.id === projectId || p.projectNumber === projectId || p.projectName === projectId,
      )

      if (!selectedProject) {
        throw new Error("Selected project not found")
      }

      console.log("Fetching details for project:", selectedProject.projectName)

      // Construct the API URL with the project ID and dates if provided
      let apiUrl = `${API_BASE_URL}/api/projects/${projectId}/details`

      // Add date parameters to the URL if they exist
      if (startDate && endDate) {
        apiUrl = `${API_BASE_URL}/api/projects/${projectId}/details/${startDate}/${endDate}`
      }

      console.log("Project details API URL:", apiUrl)
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch project details: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log("Project details received:", responseData)

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to fetch project details")
      }

      // Handle the new API response structure
      const data = responseData.data

      setProjectDetails({
        project: data.project_details,
        members: data.employees || [],
        total_hours: data.total_project_hours || 0,
      })
    } catch (error) {
      console.error("Error fetching project details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load project details. Please try again.",
        variant: "destructive",
      })
      setProjectDetails(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDetails(null)
    }
  }, [selectedProjectId])

  // Calculate total hours - use the provided total_hours or calculate from members
  const totalHours =
    projectDetails?.total_hours || projectDetails?.members.reduce((sum, member) => sum + member.hours, 0) || 0

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

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (dateString: string) => {
    if (!dateString || !dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString // Return as is if not in expected format or empty
    }

    // Convert from MM-DD-YYYY to YYYY-MM-DD
    const [month, day, year] = dateString.split("-")
    return `${year}-${month}-${day}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">View Project Details</h2>
      </div>

      <div className="space-y-6">
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoadingProjects}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-y-auto">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <SelectItem key={project.id || project.projectNumber} value={project.id || project.projectName}>
                    {project.projectName}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-gray-500">No projects available</div>
              )}
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
            onClick={() => fetchProjectDetails(selectedProjectId)}
            disabled={!selectedProjectId || isLoading}
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
        ) : projectDetails ? (
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project Number</h3>
                  <p className="text-lg font-medium">{projectDetails.project.projectNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project Name</h3>
                  <p className="text-lg font-medium">{projectDetails.project.projectName}</p>
                </div>
              </div>

              {/* Start Date and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="text-base font-medium">
                      {startDate ? formatDate(startDate) : formatDate(projectDetails.project.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="text-base font-medium">
                      {endDate ? formatDate(endDate) : formatDate(projectDetails.project.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Assigned Members</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectDetails.members && projectDetails.members.length > 0 ? (
                        projectDetails.members.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell>{member.employee_name}</TableCell>
                            <TableCell>{member.designation}</TableCell>
                            <TableCell className="text-right">{member.hours}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                            No members assigned to this project
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">
                          Total Hours
                        </TableCell>
                        <TableCell className="text-right font-bold">{totalHours}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedProjectId ? (
          <div className="text-center py-8 text-gray-500">No details available for this project</div>
        ) : (
          <div className="text-center py-8 text-gray-500">Select a project to view details</div>
        )}
      </div>
    </div>
  )
}
