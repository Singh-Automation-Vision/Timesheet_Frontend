"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Eye } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { cn } from "@/lib/utils"

interface LeaveRequest {
  employee_name: string
  manager: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: "Pending" | "Approved" | "Rejected"
  hours_requested: number
  submitted_at: string
}

// Status badge component
function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  const statusStyles = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Approved: "bg-green-100 text-green-800 border-green-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200",
      )}
    >
      {status}
    </span>
  )
}

export default function LeaveRequestsList({
  onViewRequest,
}: {
  onViewRequest: (request: LeaveRequest) => void
}) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-request`)

      if (!response.ok) {
        throw new Error(`Failed to fetch leave requests: ${response.status}`)
      }

      const data = await response.json()
      console.log("Leave requests data:", data)

      // Ensure we're setting an array, even if the API returns null or undefined
      setLeaveRequests(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching leave requests:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch leave requests",
        variant: "destructive",
      })
      setLeaveRequests([]) // Set to empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  // Safely access leaveRequests with null check
  const hasLeaveRequests = Array.isArray(leaveRequests) && leaveRequests.length > 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">All Leave Requests</h3>
        <Button variant="outline" onClick={fetchLeaveRequests} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
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
                <TableHead>Employee</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasLeaveRequests ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map((request, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{request.employee_name || "Unknown"}</TableCell>
                    <TableCell>{request.manager || "Not assigned"}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{request.submitted_at || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewRequest(request)}
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
