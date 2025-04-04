"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Loader2, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

interface Task {
  description: string
  status?: "Green" | "Yellow" | "Red"
  comment?: string
}

type CountryType = "USA" | "IND"

export default function TimesheetPage() {
  const [isAM, setIsAM] = useState(true)
  // Store tasks separately for each country
  const [usaTasks, setUsaTasks] = useState<Record<string, Task>>({})
  const [indTasks, setIndTasks] = useState<Record<string, Task>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [country, setCountry] = useState<CountryType>("USA")
  const { toast } = useToast()
  const { user } = useAuth()

  const [projects, setProjects] = useState<Array<{ id?: string; projectNumber: string; projectName: string }>>([])
  const [selectedProjects, setSelectedProjects] = useState<Record<string, string[]>>({})

  // Define hours for each country
  const countryHours = {
    USA: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"],
    IND: ["11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"],
  }

  // Get current hours based on selected country
  const hours = countryHours[country]

  // Get current tasks based on selected country
  const tasks = country === "USA" ? usaTasks : indTasks

  // Set tasks based on selected country
  const setTasks = (newTasks: Record<string, Task> | ((prev: Record<string, Task>) => Record<string, Task>)) => {
    if (country === "USA") {
      if (typeof newTasks === "function") {
        setUsaTasks(newTasks)
      } else {
        setUsaTasks(newTasks)
      }
    } else {
      if (typeof newTasks === "function") {
        setIndTasks(newTasks)
      } else {
        setIndTasks(newTasks)
      }
    }
  }

  // Fetch existing timesheet data when component mounts
  useEffect(() => {
    const fetchTimesheetData = async () => {
      if (!user?.name) {
        console.log("No user found, skipping data fetch")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log("Starting to fetch timesheet data...")

        // Format current date as MM-DD-YYYY for API
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const day = String(now.getDate()).padStart(2, "0")
        const year = now.getFullYear()
        const formattedDate = `${month}-${day}-${year}`

        console.log(`Fetching timesheet data for ${user.name} on ${formattedDate}`)
        const response = await fetch(`${API_BASE_URL}/api/timesheet/user/${user.name}/${formattedDate}`)

        // Initialize tasks with empty descriptions for both countries
        const initialUsaTasks: Record<string, Task> = {}
        const initialIndTasks: Record<string, Task> = {}

        countryHours.USA.forEach((hour) => {
          initialUsaTasks[hour] = { description: "" }
        })

        countryHours.IND.forEach((hour) => {
          initialIndTasks[hour] = { description: "" }
        })

        if (response.ok) {
          const responseData = await response.json()
          console.log("Successfully fetched timesheet data:", JSON.stringify(responseData, null, 2))

          // Determine which country's data we received
          let dataCountry: CountryType = "USA"
          if (responseData?.data?.shift === "IND") {
            dataCountry = "IND"
          } else if (responseData?.data?.country === "IND") {
            dataCountry = "IND"
          }

          console.log("Detected country from data:", dataCountry)
          setCountry(dataCountry)

          // Process the data based on the structure we received
          if (responseData.data) {
            console.log("Processing timesheet data:", responseData.data)

            // Process hours array if it exists
            if (responseData.data.hours && Array.isArray(responseData.data.hours)) {
              console.log("Processing hours array:", responseData.data.hours)

              responseData.data.hours.forEach((hourData: any) => {
                const targetTasks = dataCountry === "USA" ? initialUsaTasks : initialIndTasks
                const targetHours = countryHours[dataCountry]

                if (targetHours.includes(hourData.hour)) {
                  targetTasks[hourData.hour] = {
                    description: hourData.task || "",
                    status: hourData.progress || undefined,
                    comment: hourData.comments || "",
                  }
                }
              })
            }
          }

          console.log("Setting USA tasks:", initialUsaTasks)
          console.log("Setting IND tasks:", initialIndTasks)
        } else {
          console.log("No timesheet data found or error in response, initializing empty tasks")
          console.log("Response status:", response.status)

          try {
            const errorData = await response.text()
            console.log("Error response:", errorData)
          } catch (e) {
            console.log("Could not parse error response")
          }
        }

        // Always set the tasks, even if we didn't get data from the API
        setUsaTasks(initialUsaTasks)
        setIndTasks(initialIndTasks)
      } catch (error) {
        console.error("Error fetching timesheet data:", error)
        toast({
          title: "Error",
          description: "Failed to load timesheet data. Please try again.",
          variant: "destructive",
        })

        // Initialize with empty tasks on error
        const initialUsaTasks: Record<string, Task> = {}
        const initialIndTasks: Record<string, Task> = {}

        countryHours.USA.forEach((hour) => {
          initialUsaTasks[hour] = { description: "" }
        })

        countryHours.IND.forEach((hour) => {
          initialIndTasks[hour] = { description: "" }
        })

        setUsaTasks(initialUsaTasks)
        setIndTasks(initialIndTasks)
      } finally {
        console.log("Finished fetching timesheet data")
        setIsLoading(false)
      }
    }

    fetchTimesheetData()
  }, [user, toast])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects from API...")
        const response = await fetch(`${API_BASE_URL}/api/projectslist`)

        if (response.ok) {
          const data = await response.json()
          console.log("Raw projects data received:", data)

          // Handle the case where data.data is an array of strings
          if (data.success && Array.isArray(data.data)) {
            console.log("Projects list:", data.data)

            // Check if the array contains strings
            if (data.data.length > 0 && typeof data.data[0] === "string") {
              // Convert string array to project objects
              const formattedProjects = data.data.map((projectName) => ({
                id: projectName,
                projectNumber: projectName,
                projectName: projectName,
              }))
              setProjects(formattedProjects)
              console.log("Converted string array to project objects:", formattedProjects)
            } else {
              // It's already an array of objects
              setProjects(data.data)
            }

            console.log("Number of projects loaded:", data.data.length)
          } else {
            console.log("Invalid projects data format:", data)
          }
        } else {
          console.log("Failed to fetch projects. Status:", response.status)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      }
    }

    fetchProjects()
  }, [])

  const handleTaskChange = (hour: string, description: string) => {
    console.log(`Setting description for ${hour}: "${description}"`)
    setTasks((prev) => {
      const updated = {
        ...prev,
        [hour]: { ...prev[hour], description },
      }
      console.log(`Updated tasks for ${hour}:`, updated[hour])
      return updated
    })
  }

  const handleStatusChange = (hour: string, status: "Green" | "Yellow" | "Red") => {
    setTasks((prev) => ({
      ...prev,
      [hour]: { ...prev[hour], status },
    }))
  }

  const handleCommentChange = (hour: string, comment: string) => {
    setTasks((prev) => ({
      ...prev,
      [hour]: { ...prev[hour], comment },
    }))
  }

  const handleCountryChange = (newCountry: CountryType) => {
    if (country !== newCountry) {
      setCountry(newCountry)
    }
  }

  const handleAddProject = (hour: string, projectId: string) => {
    if (!projectId) return

    setSelectedProjects((prev) => {
      const hourProjects = [...(prev[hour] || [])]

      // Check if project is already selected
      if (hourProjects.includes(projectId)) return prev

      // Check if we already have 3 projects
      if (hourProjects.length >= 3) return prev

      // Add the new project
      hourProjects.push(projectId)

      return {
        ...prev,
        [hour]: hourProjects,
      }
    })
  }

  const handleRemoveProject = (hour: string, projectId: string) => {
    setSelectedProjects((prev) => {
      const hourProjects = [...(prev[hour] || [])]
      const index = hourProjects.indexOf(projectId)

      if (index !== -1) {
        hourProjects.splice(index, 1)
      }

      return {
        ...prev,
        [hour]: hourProjects,
      }
    })
  }

  // Function to get project name from ID
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project ? project.projectName : projectId
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)
    try {
      // Format the current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split("T")[0]

      if (isAM) {
        // For AM submission, include all hours that are displayed in the AM section
        const filteredTasks: Record<string, { description: string }> = {}

        // Get all hours that should be displayed in the AM section
        const displayedHours = hours

        // Include all tasks with descriptions for the displayed hours
        Object.entries(tasks).forEach(([hour, task]) => {
          if (task.description && displayedHours.includes(hour)) {
            filteredTasks[hour] = { description: task.description }
          }
        })

        // Format data according to the original structure for AM
        const data = {
          employee_name: user?.name || "Unknown User",
          date: currentDate,
          tasks: filteredTasks,
          period: "AM",
          country: country,
        }

        // Add detailed logging of the AM data being sent
        console.log("AM Timesheet data being sent to API:", JSON.stringify(data, null, 2))

        const response = await fetch(`${API_BASE_URL}/api/AM`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } else {
        // For PM submission, format data according to the expected structure
        const hoursArray = Object.entries(tasks)
          .filter(([hour, task]) => (hours.includes(hour) || extraHours.includes(hour)) && task.description)
          .map(([hour, task]) => {
            // Get the selected projects for this hour
            const hourProjects = selectedProjects[hour] || []

            // Create the projects object with only the selected projects
            const projects: Record<string, string> = {}
            hourProjects.forEach((projectId, index) => {
              if (projectId) {
                projects[index.toString()] = projectId
              }
            })

            return {
              hour,
              task: task.description,
              progress: task.status || undefined,
              comments: task.comment || "",
              projects: Object.keys(projects).length > 0 ? projects : undefined,
            }
          })

        // Format data according to the structure expected by the API
        const data = {
          employee_name: user?.name || "Unknown User",
          date: currentDate,
          hours: hoursArray,
          shift: country,
        }

        console.log("PM Timesheet data being sent to API:", JSON.stringify(data, null, 2))

        const response = await fetch(`${API_BASE_URL}/api/PM`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }

      toast({
        title: "Success",
        description: `${isAM ? "AM" : "PM"} Timesheet saved successfully`,
      })
    } catch (error) {
      console.error("Error saving timesheet:", error)
      setError("Failed to save timesheet. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save timesheet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [extraHours, setExtraHours] = useState<string[]>([])

  // Update the addExtraHour function to correctly increment the hour
  const addExtraHour = () => {
    const lastHour = extraHours.length > 0 ? extraHours[extraHours.length - 1] : hours[hours.length - 1]

    const [hourPart, period] = lastHour.split(" ")
    const hourValue = Number.parseInt(hourPart.split(":")[0])
    const nextHour = hourValue + 1

    // Handle period change (AM/PM) if needed
    let nextPeriod = period
    if (hourValue === 11) {
      nextPeriod = period === "AM" ? "PM" : "AM"
    }

    const newHour = `${nextHour > 12 ? nextHour - 12 : nextHour}:00 ${nextPeriod}`
    setExtraHours((prev) => [...prev, newHour])
    setTasks((prev) => ({ ...prev, [newHour]: { description: "" } }))
  }

  if (isLoading) {
    console.log("Rendering loading state")
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  console.log("Rendering timesheet form, isLoading:", isLoading)
  console.log("Current country:", country)
  console.log("Current tasks:", tasks)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00FF00]">Timesheet</h1>
        <p className="text-gray-600">Log your daily tasks and progress</p>
      </div>
      <div className="pt-6 p-4 max-w-7xl mx-auto bg-white rounded-lg shadow-sm h-full flex flex-col">
        {error && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">{error}</div>
        )}

        {/* Country Selection */}
        <div className="mb-4 border-b border-[#D1D1D1]">
          <div className="flex gap-4">
            <button
              onClick={() => handleCountryChange("USA")}
              className={cn(
                "px-4 py-2 font-medium transition-colors",
                country === "USA" ? "border-b-2 border-[#00FF00] text-[#00FF00]" : "text-gray-500",
              )}
            >
              USA
            </button>
            <button
              onClick={() => handleCountryChange("IND")}
              className={cn(
                "px-4 py-2 font-medium transition-colors",
                country === "IND" ? "border-b-2 border-[#00FF00] text-[#00FF00]" : "text-gray-500",
              )}
            >
              IND
            </button>
          </div>
        </div>

        {/* AM/PM Selection */}
        <div className="mb-4 border-b border-[#D1D1D1]">
          <div className="flex gap-4">
            <button
              onClick={() => setIsAM(true)}
              className={cn(
                "px-4 py-2 font-medium transition-colors",
                isAM ? "border-b-2 border-[#00FF00] text-[#00FF00]" : "text-gray-500",
              )}
            >
              AM
            </button>
            <button
              onClick={() => setIsAM(false)}
              className={cn(
                "px-4 py-2 font-medium transition-colors",
                !isAM ? "border-b-2 border-[#00FF00] text-[#00FF00]" : "text-gray-500",
              )}
            >
              PM
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-auto px-2 pb-6">
          {isAM ? (
            // AM Section
            <div className="grid grid-cols-[80px_1fr] gap-6 pt-4">
              {hours.map((hour) => (
                <div key={hour} className="mt-1 contents">
                  <div className="py-2 font-medium text-black text-sm flex items-center justify-end pr-2">{hour}</div>
                  <Input
                    type="text"
                    placeholder="Enter task"
                    value={tasks[hour]?.description || ""}
                    onChange={(e) => handleTaskChange(hour, e.target.value)}
                    className="w-full border-[#D1D1D1] rounded-md py-2 text-base"
                  />
                </div>
              ))}
            </div>
          ) : (
            // PM Section
            <div className="grid grid-cols-[120px_2fr_1fr_auto_1fr] gap-x-4 gap-y-6 items-start pt-4">
              {/* Regular hours */}
              {hours.map((hour) => (
                <div key={hour} className="mt-1 contents">
                  <div className="py-2 font-medium text-black text-sm flex items-center justify-end pr-4">{hour}</div>
                  <div className="py-2 text-gray-700 text-sm">
                    <div className="min-h-[2.5rem] whitespace-pre-wrap break-words">
                      {tasks[hour]?.description || "No task entered"}
                    </div>
                  </div>
                  <div className="py-2">
                    {/* Selected project tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(selectedProjects[hour] || []).map((projectId, index) => (
                        <div
                          key={index}
                          className="bg-[#e6f7e6] text-black text-xs px-2 py-1 rounded-md flex items-center group"
                        >
                          <span>{getProjectName(projectId)}</span>
                          <button
                            onClick={() => handleRemoveProject(hour, projectId)}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove project"
                          >
                            <X size={14} className="text-gray-600 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Project dropdown */}
                    <select
                      className="w-full border border-[#D1D1D1] rounded-md py-1 text-sm"
                      value=""
                      onChange={(e) => {
                        handleAddProject(hour, e.target.value)
                        e.target.value = "" // Reset dropdown after selection
                      }}
                      disabled={(selectedProjects[hour] || []).length >= 3}
                    >
                      <option value="">
                        {(selectedProjects[hour] || []).length >= 3 ? "Max 3 projects selected" : "Select Project"}
                      </option>
                      {projects.map((project, idx) => (
                        <option key={idx} value={project.id}>
                          {project.projectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1 items-center justify-center py-2">
                    {(["Green", "Yellow", "Red"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(hour, status)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          "border border-transparent hover:opacity-80",
                          status === "Green" && "bg-[#00FF00]",
                          status === "Yellow" && "bg-[#FFC107]",
                          status === "Red" && "bg-[#FF0000]",
                          tasks[hour]?.status === status && "ring-2 ring-offset-1 ring-black",
                        )}
                      />
                    ))}
                  </div>
                  <Textarea
                    placeholder="Add comments..."
                    value={tasks[hour]?.comment || ""}
                    onChange={(e) => handleCommentChange(hour, e.target.value)}
                    className="w-full border-[#D1D1D1] rounded-md text-xs resize-none p-2 h-10 max-w-[200px]"
                    rows={1}
                  />
                </div>
              ))}

              {/* Overtime hours - with editable description */}
              {extraHours.map((hour) => (
                <div key={hour} className="mt-1 contents">
                  <div className="py-2 font-medium text-black text-sm flex items-center justify-end pr-4">{hour}</div>
                  <Input
                    type="text"
                    placeholder="Enter overtime task"
                    value={tasks[hour]?.description || ""}
                    onChange={(e) => handleTaskChange(hour, e.target.value)}
                    className="w-full border-[#D1D1D1] rounded-md py-2 text-sm"
                  />
                  <div className="py-2">
                    {/* Selected project tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(selectedProjects[hour] || []).map((projectId, index) => (
                        <div
                          key={index}
                          className="bg-[#e6f7e6] text-black text-xs px-2 py-1 rounded-md flex items-center group"
                        >
                          <span>{getProjectName(projectId)}</span>
                          <button
                            onClick={() => handleRemoveProject(hour, projectId)}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove project"
                          >
                            <X size={14} className="text-gray-600 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Project dropdown */}
                    <select
                      className="w-full border border-[#D1D1D1] rounded-md py-1 text-sm"
                      value=""
                      onChange={(e) => {
                        handleAddProject(hour, e.target.value)
                        e.target.value = "" // Reset dropdown after selection
                      }}
                      disabled={(selectedProjects[hour] || []).length >= 3}
                    >
                      <option value="">
                        {(selectedProjects[hour] || []).length >= 3 ? "Max 3 projects selected" : "Select Project"}
                      </option>
                      {projects.map((project, idx) => (
                        <option key={idx} value={project.id}>
                          {project.projectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1 items-center justify-center py-2">
                    {(["Green", "Yellow", "Red"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(hour, status)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          "border border-transparent hover:opacity-80",
                          status === "Green" && "bg-[#00FF00]",
                          status === "Yellow" && "bg-[#FFC107]",
                          status === "Red" && "bg-[#FF0000]",
                          tasks[hour]?.status === status && "ring-2 ring-offset-1 ring-black",
                        )}
                      />
                    ))}
                  </div>
                  <Textarea
                    placeholder="Add comments..."
                    value={tasks[hour]?.comment || ""}
                    onChange={(e) => handleCommentChange(hour, e.target.value)}
                    className="w-full border-[#D1D1D1] rounded-md text-xs resize-none p-2 h-10 max-w-[200px]"
                    rows={1}
                  />
                </div>
              ))}

              {/* Add overtime button */}
              <div className="mt-1 contents">
                <div className="py-2 font-medium text-black text-sm flex items-center justify-end pr-2"></div>
                <Button
                  onClick={addExtraHour}
                  className="w-full bg-[#00FF00] text-black hover:bg-[#00FF00]/90 col-span-3"
                >
                  + Add Overtime Hour
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          className="mt-2 bg-[#00FF00] text-black hover:bg-[#00FF00]/90 transition-colors rounded-md px-4 py-2 text-sm font-medium"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            `Save ${isAM ? "AM" : "PM"} Timesheet`
          )}
        </Button>
      </div>
    </div>
  )
}

