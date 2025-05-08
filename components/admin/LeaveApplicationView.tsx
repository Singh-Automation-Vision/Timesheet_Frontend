"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface LeaveApplication {
  id: string
  name: string
  manager?: string
  status: string
  startDate: string
  endDate?: string
  leaveType: string
  reason?: string
  days: number
}

interface LeaveApplicationViewProps {
  application: LeaveApplication
  onBack: () => void
  onStatusUpdate: (status: "Approved" | "Rejected") => Promise<void>
}

export default function LeaveApplicationView({ application, onBack, onStatusUpdate }: LeaveApplicationViewProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleStatusChange = async (newStatus: "Approved" | "Rejected") => {
    setIsUpdating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-request/${application.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`)
      }

      toast({
        title: "Success",
        description: `Leave application ${newStatus.toLowerCase()} successfully`,
      })

      await onStatusUpdate(newStatus)
    } catch (error) {
      console.error("Error updating leave application status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      // Check if date is in MM-DD-YYYY format
      if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [month, day, year] = dateString.split("-")
        return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      // Otherwise try to parse as is
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString // Return original if parsing fails
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Button>
        <h2 className="text-xl font-bold">Leave Application Details</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Leave Request from {application.name}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                application.status === "Approved"
                  ? "bg-green-100 text-green-800"
                  : application.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {application.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Employee</h3>
              <p className="text-lg font-medium">{application.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Manager</h3>
              <p className="text-lg font-medium">{application.manager || "Not specified"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
              <p className="text-lg font-medium">{application.leaveType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="text-lg font-medium">{application.days} day(s)</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
              <p className="text-lg font-medium">
                {formatDate(application.startDate)}
                {application.endDate &&
                  application.endDate !== application.startDate &&
                  ` to ${formatDate(application.endDate)}`}
              </p>
            </div>
          </div>

          {application.reason && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reason</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p className="whitespace-pre-wrap">{application.reason}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          {application.status === "Pending" && (
            <>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => handleStatusChange("Rejected")}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("Approved")}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
