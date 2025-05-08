"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import LeaveRequestsList from "./LeaveRequestsList"
import LeaveRequestDetail from "./LeaveRequestDetail"
import LeaveBalances from "./LeaveBalances"

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

export default function LeaveManagement({ onBack }: { onBack: () => void }) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [activeTab, setActiveTab] = useState("requests")

  // Handle viewing a specific leave request
  const handleViewRequest = (request: LeaveRequest) => {
    setSelectedRequest(request)
  }

  // Handle going back to the list view
  const handleBackToList = () => {
    setSelectedRequest(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Button>
        <h2 className="text-xl font-bold">Leave Management</h2>
      </div>

      {selectedRequest ? (
        <LeaveRequestDetail leaveRequest={selectedRequest} onBack={handleBackToList} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests">Leave Requests</TabsTrigger>
            <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <LeaveRequestsList onViewRequest={handleViewRequest} />
          </TabsContent>

          <TabsContent value="balances">
            <LeaveBalances />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
