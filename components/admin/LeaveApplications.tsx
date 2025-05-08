"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Loader2, Eye } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import LeaveApplicationView from "./LeaveApplicationView"

interface LeaveApplication {
  id: string
  name: string
  manager: string
  status: string
  startDate: string
  endDate: string
  leaveType: string
  reason: string
  days: number
}

export default function LeaveApplications({ onBack }: { onBack: () => void }) {
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "detail">("list")
  const { toast } = useToast()

  useEffect(() => {
    fetchLeaveApplications()
  }, [])

  const fetchLeaveApplications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-request`)

      if (!response.ok) {
        throw new Error("Failed to fetch leave applications")
      }

      const data = await response.json()
      console.log("Leave applications data:", data)
      setApplications(data)
    } catch (error) {
      console.error("Error fetching leave applications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch leave applications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewApplication = async (applicationId: string) => {
    try {
      // Find the application in the current list
      const application = applications.find((app) => app.id === applicationId)

      if (application) {
        setSelectedApplication(application)
        setViewMode("detail")
      } else {
        // If not found in the current list, fetch it from the API
        const response = await fetch(`${API_BASE_URL}/api/leave-request/${applicationId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch leave application details")
        }

        const data = await response.json()
        setSelectedApplication(data)
        setViewMode("detail")
      }
    } catch (error) {
      console.error("Error fetching leave application details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch leave application details",
        variant: "destructive",
      })
    }
  }

  const handleStatusUpdate = async (status: "Approved" | "Rejected") => {
    // After successful update, refresh the list
    await fetchLeaveApplications()
    setViewMode("list")
    setSelectedApplication(null)
  }

  if (viewMode === "detail" && selectedApplication) {
    return (
      <LeaveApplicationView
        application={selectedApplication}
        onBack={() => setViewMode("list")}
        onStatusUpdate={handleStatusUpdate}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">Leave Applications</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No leave applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.name}</TableCell>
                    <TableCell>{application.manager || "Not specified"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : application.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {application.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewApplication(application.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
