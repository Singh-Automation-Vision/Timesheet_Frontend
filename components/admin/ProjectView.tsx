"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Calendar } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"

interface Project {
  id?: string
  projectNumber: string
  projectName: string
  startDate: string
  endDate: string
}

interface ProjectMember {
  employee_name: string // Changed from name to employee_name
  designation: string
  hours: number
}

interface ProjectDetails {
  project: Project
  members: ProjectMember[]
  total_hours?: number // Added to handle the total_hours in the response
}

export default function ProjectView({ onBack }: { onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const { toast } = useToast()

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

      // Make the API call to get project details
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/details`)

      if (!response.ok) {
        throw new Error(`Failed to fetch project details: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Project details received:", data)

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch project details")
      }

      // Handle the special format where members is a tuple with array and total_hours
      let members = []
      let totalHours = 0

      if (Array.isArray(data.members)) {
        // If members is a regular array
        members = data.members
      } else if (data.members && Array.isArray(data.members[0])) {
        // If members is a tuple with [array, total_hours]
        members = data.members[0]
        totalHours = data.members[1]?.total_hours || 0
      }

      setProjectDetails({
        project: data.project,
        members: members,
        total_hours: totalHours || data.total_hours,
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
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId)
    } else {
      setProjectDetails(null)
    }
  }, [selectedProjectId])

  // Calculate total hours - use the provided total_hours or calculate from members
  const totalHours =
    projectDetails?.total_hours || projectDetails?.members.reduce((sum, member) => sum + member.hours, 0) || 0

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
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
        <h2 className="text-xl font-bold">View Project Details</h2>
      </div>

      <div className="space-y-6">
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoadingProjects}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id || project.projectNumber} value={project.id || project.projectName}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

              {/* Added Start Date and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="text-base font-medium">{formatDate(projectDetails.project.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="text-base font-medium">{formatDate(projectDetails.project.endDate)}</p>
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

