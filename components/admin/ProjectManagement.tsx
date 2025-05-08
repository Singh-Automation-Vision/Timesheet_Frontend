"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, RefreshCw, Eye, Edit } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ProjectView from "./ProjectView"

interface Project {
  projectNumber: string
  projectName: string
  startDate: string
  endDate: string
}

type Mode = "none" | "add" | "remove" | "view" | "edit" | "edit-form"

export default function ProjectManagement() {
  const [mode, setMode] = useState<Mode>("none")
  const [newProject, setNewProject] = useState<Project>({
    projectNumber: "",
    projectName: "",
    startDate: "",
    endDate: "",
  })
  const [deleteProject, setDeleteProject] = useState({
    projectNumber: "",
    projectName: "",
  })
  const [editProjectSearch, setEditProjectSearch] = useState({
    projectNumber: "",
    projectName: "",
  })
  const [editProject, setEditProject] = useState<Project>({
    projectNumber: "",
    projectName: "",
    startDate: "",
    endDate: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const { toast } = useToast()

  // Update the fetchProjects function to handle different response formats
  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    try {
      console.log("Fetching projects from API...")
      const response = await fetch(`${API_BASE_URL}/api/projects`)

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Projects data received:", data)

      // Handle different response formats
      if (Array.isArray(data)) {
        // If data is an array of projects
        setProjects(data)
      } else if (data.success && Array.isArray(data.data)) {
        // If data has success and data properties
        setProjects(data.data)
      } else if (data.projectNumber && data.projectName) {
        // If data is a single project object
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

  useEffect(() => {
    fetchProjects()
  }, [])

  // Add this useEffect to monitor editProject state changes
  useEffect(() => {
    if (editProject.projectNumber || editProject.projectName) {
      console.log("editProject state updated:", editProject)
    }
  }, [editProject])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    formType: "add" | "remove" | "edit" | "edit-form",
  ) => {
    const { name, value } = e.target

    switch (formType) {
      case "add":
        setNewProject((prev) => ({ ...prev, [name]: value }))
        break
      case "remove":
        setDeleteProject((prev) => ({ ...prev, [name]: value }))
        break
      case "edit":
        setEditProjectSearch((prev) => ({ ...prev, [name]: value }))
        break
      case "edit-form":
        setEditProject((prev) => ({ ...prev, [name]: value }))
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Submitting project data:", newProject)

      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to add project: ${errorText}`)
      }

      const result = await response.json()
      console.log("Project added successfully:", result)

      toast({
        title: "Success",
        description: "Project added successfully",
      })

      // Reset the form
      setNewProject({
        projectNumber: "",
        projectName: "",
        startDate: "",
        endDate: "",
      })
      setMode("none")

      // Refresh the project list
      fetchProjects()
    } catch (error) {
      console.error("Error adding project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Deleting project:", deleteProject)

      const response = await fetch(`${API_BASE_URL}/api/projects/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteProject),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete project: ${errorText}`)
      }

      const result = await response.json()
      console.log("Project deleted successfully:", result)

      toast({
        title: "Success",
        description: "Project removed successfully",
      })

      setDeleteProject({
        projectNumber: "",
        projectName: "",
      })
      setMode("none")

      // Refresh the project list
      fetchProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Updated handleFetchProjectForEdit function to properly handle and display project data
  const handleFetchProjectForEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Fetching project for edit:", editProjectSearch)

      // Directly fetch from API without checking local state first
      const response = await fetch(`${API_BASE_URL}/api/projects/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProjectSearch),
      })

      if (!response.ok) {
        throw new Error(`Project not found: ${editProjectSearch.projectNumber} - ${editProjectSearch.projectName}`)
      }

      // Parse the response
      const result = await response.json()
      console.log("Project fetched successfully, raw result:", result)

      // Extract project data, handling different response formats
      let projectData
      if (result.project) {
        projectData = result.project
      } else if (result.data) {
        projectData = result.data
      } else {
        projectData = result
      }

      console.log("Extracted project data:", projectData)

      // Force the dates to be strings
      const startDate = projectData.startDate ? String(projectData.startDate) : ""
      const endDate = projectData.endDate ? String(projectData.endDate) : ""

      // Create a new object with the project data
      const updatedProject = {
        projectNumber: projectData.projectNumber || editProjectSearch.projectNumber,
        projectName: projectData.projectName || editProjectSearch.projectName,
        startDate: startDate,
        endDate: endDate,
      }

      console.log("Setting edit project state to:", updatedProject)

      // Update the state with the project data - use a callback to ensure we're working with the latest state
      setEditProject(updatedProject)

      // Switch to edit form mode
      setMode("edit-form")
    } catch (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Updating project data:", editProject)

      // Use the project number and name for the API endpoint
      const response = await fetch(`${API_BASE_URL}/api/projects/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: editProjectSearch,
          update: editProject,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update project: ${errorText}`)
      }

      const result = await response.json()
      console.log("Project updated successfully:", result)

      toast({
        title: "Success",
        description: "Project updated successfully",
      })

      // Reset the form
      setEditProject({
        projectNumber: "",
        projectName: "",
        startDate: "",
        endDate: "",
      })
      setEditProjectSearch({
        projectNumber: "",
        projectName: "",
      })
      setMode("none")

      // Refresh the project list
      fetchProjects()
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If in view mode, show the ProjectView component
  if (mode === "view") {
    return <ProjectView onBack={() => setMode("none")} />
  }

  return (
    <div className="space-y-6">
      {mode === "none" && (
        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => setMode("add")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
          <Button onClick={() => setMode("edit")} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Project
          </Button>
          <Button onClick={() => setMode("view")} variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Projects
          </Button>
          <Button onClick={() => setMode("remove")} variant="destructive" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Remove Project
          </Button>
        </div>
      )}

      {mode === "add" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Add New Project</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <Input
            name="projectNumber"
            value={newProject.projectNumber}
            onChange={(e) => handleInputChange(e, "add")}
            placeholder="Project Number"
            required
          />
          <Input
            name="projectName"
            value={newProject.projectName}
            onChange={(e) => handleInputChange(e, "add")}
            placeholder="Project Name"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={newProject.startDate}
                onChange={(e) => handleInputChange(e, "add")}
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={newProject.endDate}
                onChange={(e) => handleInputChange(e, "add")}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Project"
            )}
          </Button>
        </form>
      )}

      {mode === "edit" && (
        <form onSubmit={handleFetchProjectForEdit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit Project</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <div className="space-y-4">
            <Input
              name="projectNumber"
              value={editProjectSearch.projectNumber}
              onChange={(e) => handleInputChange(e, "edit")}
              placeholder="Project Number"
              required
            />
            <Input
              name="projectName"
              value={editProjectSearch.projectName}
              onChange={(e) => handleInputChange(e, "edit")}
              placeholder="Project Name"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch Project Details"
            )}
          </Button>
        </form>
      )}

      {mode === "edit-form" && (
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit Project:</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h4 className="font-medium mb-2">Project Details:</h4>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="text-sm font-medium">Project Number:</span>
                <Input
                  name="projectNumber"
                  value={editProject.projectNumber}
                  onChange={(e) => handleInputChange(e, "edit-form")}
                  placeholder="Project Number"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <span className="text-sm font-medium">Project Name:</span>
                <Input
                  name="projectName"
                  value={editProject.projectName}
                  onChange={(e) => handleInputChange(e, "edit-form")}
                  placeholder="Project Name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <span className="text-sm font-medium">Start Date:</span>
                <Input
                  id="editStartDate"
                  name="startDate"
                  type="date"
                  value={editProject.startDate}
                  onChange={(e) => handleInputChange(e, "edit-form")}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <span className="text-sm font-medium">End Date:</span>
                <Input
                  id="editEndDate"
                  name="endDate"
                  type="date"
                  value={editProject.endDate}
                  onChange={(e) => handleInputChange(e, "edit-form")}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Project"
            )}
          </Button>
        </form>
      )}

      {mode === "remove" && (
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Remove Project</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <div className="space-y-4">
            <Input
              name="projectNumber"
              value={deleteProject.projectNumber}
              onChange={(e) => handleInputChange(e, "remove")}
              placeholder="Project Number"
              required
            />
            <Input
              name="projectName"
              value={deleteProject.projectName}
              onChange={(e) => handleInputChange(e, "remove")}
              placeholder="Project Name"
              required
            />
          </div>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Project"
            )}
          </Button>
        </form>
      )}

      {/* Projects Table */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Projects</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={isLoadingProjects}
            className="flex items-center gap-2"
          >
            {isLoadingProjects ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {isLoadingProjects ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Number</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project, index) => (
                    <TableRow key={`${project.projectNumber}-${project.projectName}-${index}`}>
                      <TableCell>{project.projectNumber}</TableCell>
                      <TableCell>{project.projectName}</TableCell>
                      <TableCell>{project.startDate}</TableCell>
                      <TableCell>{project.endDate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
