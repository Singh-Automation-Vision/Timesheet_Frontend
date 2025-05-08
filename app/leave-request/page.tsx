"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import DatePicker from "@/components/DatePicker"
import { Plus, Minus } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface LeaveStatus {
  name: string
  Total_leave_hours: number
  Sick_leave_hours: number
  Sick_leave_hours_used: number
  Casual_leave_hours: number
  Casual_leave_hours_used: number
  Remaining_leave_hours: number
  success: boolean
}

interface ApiResponse {
  message?: string
  success: boolean
}

export default function LeaveRequestPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [leaveStatus, setLeaveStatus] = useState<LeaveStatus | null>(null)
  const [isLoadingLeaveStatus, setIsLoadingLeaveStatus] = useState(false)

  // Get today's date in MM-DD-YYYY format
  const getTodayFormatted = () => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const year = today.getFullYear()
    return `${month}-${day}-${year}`
  }

  const [formData, setFormData] = useState({
    name: "",
    days: 1,
    hours: 1,
    requestType: "days", // New field to track if request is in days or hours
    startDate: getTodayFormatted(),
    endDate: getTodayFormatted(),
    leaveType: "",
    reason: "",
    agreed: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch leave status when user is loaded
  useEffect(() => {
    if (user?.name) {
      fetchLeaveStatus(user.name)
    }
  }, [user])

  const fetchLeaveStatus = async (name: string) => {
    setIsLoadingLeaveStatus(true)

    // Log the API URL and parameters
    const apiUrl = `${API_BASE_URL}/api/leave-request/available/${encodeURIComponent(name)}`
    console.log("Fetching leave status from:", apiUrl)
    console.log("User name:", name)

    try {
      const response = await fetch(apiUrl)

      // Log the response status
      console.log("Leave status API response status:", response.status)

      if (!response.ok) {
        throw new Error("Failed to fetch leave status")
      }

      const data = await response.json()

      // Log the response data
      console.log("Leave status API response data:", data)

      setLeaveStatus(data)
    } catch (error) {
      console.error("Error fetching leave status:", error)
      toast({
        title: "Error",
        description: "Failed to fetch leave status",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLeaveStatus(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Error",
        description: "You must be logged in to view this page",
        variant: "destructive",
      })
      router.push("/login")
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
      }))
    }
  }, [user, isLoading, router, toast])

  // Update end date when start date changes (if days = 1)
  useEffect(() => {
    if (formData.days === 1 && formData.startDate) {
      setFormData((prev) => ({
        ...prev,
        endDate: prev.startDate,
      }))
    }
  }, [formData.startDate, formData.days])

  const handleDaysChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      days: increment ? Math.min(prev.days + 1, 30) : Math.max(prev.days - 1, 1),
    }))
  }

  const handleHoursChange = (value: string) => {
    const hours = Number.parseInt(value, 10)
    setFormData((prev) => ({
      ...prev,
      hours: hours,
    }))
  }

  const handleRequestTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      requestType: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Log form data for debugging
    console.log("Form data being submitted:", formData)

    // Validate form based on request type
    if (formData.requestType === "days") {
      if (!formData.startDate || (formData.days > 1 && !formData.endDate) || !formData.leaveType) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Check if user has enough leaves for days request (assuming 8 hours per day)
      if (leaveStatus && formData.days * 8 > leaveStatus.Remaining_leave_hours) {
        toast({
          title: "Error",
          description: `You don't have enough leave hours. You have ${leaveStatus.Remaining_leave_hours} hours remaining.`,
          variant: "destructive",
        })
        return
      }
    } else {
      // For hours request
      if (!formData.startDate || !formData.leaveType) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Check if user has enough leave hours
      if (leaveStatus && formData.hours > leaveStatus.Remaining_leave_hours) {
        toast({
          title: "Error",
          description: `You don't have enough leave hours. You have ${leaveStatus.Remaining_leave_hours} hours remaining.`,
          variant: "destructive",
        })
        return
      }
    }

    if (!formData.agreed) {
      toast({
        title: "Error",
        description: "Please agree to the terms",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Create the request payload based on request type
    const requestData = {
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.requestType === "days" ? formData.endDate : formData.startDate,
      leaveType: formData.leaveType,
      reason: formData.reason,
      submissionDate: getTodayFormatted(),
    }

    // Add either days or hours based on request type
    if (formData.requestType === "days") {
      Object.assign(requestData, { days: formData.days })
    } else {
      Object.assign(requestData, { hours: formData.hours })
    }

    // Log the exact data being sent to the API
    console.log("Data being sent to API:", requestData)
    console.log("API URL:", `${API_BASE_URL}/api/leave-request`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      // Log the response status
      console.log("API Response status:", response.status)

      const data: ApiResponse = await response.json()

      // Log the response data
      console.log("API Response data:", data)

      // Check if the API response indicates success
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Your leave request has been submitted successfully",
        })

        // Refresh leave status
        if (user?.name) {
          fetchLeaveStatus(user.name)
        }

        // Reset form
        setFormData({
          name: user?.name || "",
          days: 1,
          hours: 1,
          requestType: "days",
          startDate: getTodayFormatted(),
          endDate: getTodayFormatted(),
          leaveType: "",
          reason: "",
          agreed: false,
        })
      } else {
        // Display the error message from the API
        toast({
          title: "Error",
          description: data.message || "Failed to submit leave request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("API Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit leave request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Leave Request Form - Now on the left */}
        <div className="w-full md:w-3/4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Leave Request Form</CardTitle>
              <CardDescription>Submit your time off request</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} readOnly className="bg-gray-50" />
                </div>

                {/* Request Type Selection */}
                <div className="space-y-2">
                  <Label>Time Off Request Type</Label>
                  <RadioGroup
                    value={formData.requestType}
                    onValueChange={handleRequestTypeChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="days" id="days" />
                      <Label htmlFor="days">Days</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hours" id="hours" />
                      <Label htmlFor="hours">Hours</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Days Selection - Show only if days is selected */}
                {formData.requestType === "days" && (
                  <div className="space-y-2">
                    <Label>Time Off Request (Days)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDaysChange(false)}
                        disabled={formData.days <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-12 text-center font-medium">{formData.days}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDaysChange(true)}
                        disabled={
                          formData.days >= 30 || (leaveStatus && formData.days * 8 > leaveStatus.Remaining_leave_hours)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Hours Selection - Show only if hours is selected */}
                {formData.requestType === "hours" && (
                  <div className="space-y-2">
                    <Label htmlFor="hours">Time Off Request (Hours)</Label>
                    <Select value={formData.hours.toString()} onValueChange={handleHoursChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="5">5 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="7">7 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    label="Beginning On"
                    value={formData.startDate}
                    onChange={(date) => {
                      console.log("Start date changed to:", date)
                      setFormData((prev) => ({ ...prev, startDate: date }))
                    }}
                  />

                  {formData.requestType === "days" && formData.days > 1 && (
                    <DatePicker
                      label="Ending On"
                      value={formData.endDate}
                      onChange={(date) => {
                        console.log("End date changed to:", date)
                        setFormData((prev) => ({ ...prev, endDate: date }))
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, leaveType: value }))}
                    value={formData.leaveType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vacation">Vacation</SelectItem>
                      <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                      <SelectItem value="Funeral/Bereavement">Funeral/Bereavement</SelectItem>
                      <SelectItem value="Jury Duty">Jury Duty</SelectItem>
                      <SelectItem value="Family Reasons">Family Reasons</SelectItem>
                      <SelectItem value="Medical Leave">Medical Leave</SelectItem>
                      <SelectItem value="To Vote">To Vote</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Request</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide details about your leave request"
                    value={formData.reason}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreed}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreed: checked === true }))}
                  />
                  <Label htmlFor="terms" className="font-medium">
                    <strong>I understand that this request is subject to approval by my employer</strong>
                  </Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={!formData.agreed || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Leave Status Card - Now on the right */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLeaveStatus ? (
                <div className="flex justify-center py-4">Loading...</div>
              ) : leaveStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total leave hours:</span>
                    <span className="font-semibold">{leaveStatus.Total_leave_hours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sick leave hours:</span>
                    <span className="font-semibold">{leaveStatus.Sick_leave_hours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sick leave hours used:</span>
                    <span className="font-semibold">{leaveStatus.Sick_leave_hours_used}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Casual leave hours:</span>
                    <span className="font-semibold">{leaveStatus.Casual_leave_hours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Casual leave hours used:</span>
                    <span className="font-semibold">{leaveStatus.Casual_leave_hours_used}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Remaining leave hours:</span>
                    <span className="font-semibold text-lg text-green-600">{leaveStatus.Remaining_leave_hours}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No leave data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
