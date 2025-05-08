"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface LeaveRequest {
  employee_name: string
  manager?: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: "Pending" | "Approved" | "Rejected"
  hours_requested: number
  submitted_at: string
}

interface LeaveRequestDetailProps {
  leaveRequest: LeaveRequest
  onBack: () => void
}

export default function LeaveRequestDetail({ leaveRequest: initialLeaveRequest, onBack }: LeaveRequestDetailProps) {
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest>(initialLeaveRequest)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const updateLeaveStatus = async (status: "Approved" | "Rejected") => {
    setIsUpdating(true)
    try {
      const encodedName = encodeURIComponent(leaveRequest.employee_name)
      const response = await fetch(`${API_BASE_URL}/api/leave-request/by-name/${encodedName}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          submitted_at: leaveRequest.submitted_at,
          leave_type: leaveRequest.leave_type,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update leave request: ${response.status}`)
      }

      const data = await response.json()
      console.log("Update response:", data)

      // Update the local state with the new status
      setLeaveRequest((prev) => ({ ...prev, status }))

      toast({
        title: "Success",
        description: `Leave request ${status.toLowerCase()} successfully`,
      })
    } catch (error) {
      console.error("Error updating leave request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update leave request",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Format date for display (YYYY-MM-DD to more readable format)
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString // Return original if parsing fails
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to List
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Leave Request: {leaveRequest.employee_name}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                leaveRequest.status === "Approved"
                  ? "bg-green-100 text-green-800"
                  : leaveRequest.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {leaveRequest.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Employee</h3>
            <p className="text-lg font-medium">{leaveRequest.employee_name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
              <p className="text-lg font-medium">{leaveRequest.leave_type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Hours Requested</h3>
              <p className="text-lg font-medium">{leaveRequest.hours_requested}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="text-lg font-medium">{formatDate(leaveRequest.start_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="text-lg font-medium">{formatDate(leaveRequest.end_date)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
            <p className="text-lg font-medium">{formatDate(leaveRequest.submitted_at)}</p>
          </div>

          {leaveRequest.reason && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reason</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p className="whitespace-pre-wrap">{leaveRequest.reason}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          {leaveRequest.status === "Pending" && (
            <>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => updateLeaveStatus("Rejected")}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => updateLeaveStatus("Approved")}
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
