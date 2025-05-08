"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface EmployeeLeaveBalance {
  name: string
  Sick_leave_hours_used: number
  Casual_leave_hours_used: number
  Remaining_leave_hours: number
}

export default function LeaveBalances() {
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchLeaveBalances = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/leave-balances`)

        if (!response.ok) {
          throw new Error("Failed to fetch leave balances")
        }

        const data = await response.json()
        setLeaveBalances(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching leave balances:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaveBalances()
  }, [])

  // Filter employees based on search term
  const filteredBalances = leaveBalances.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search employees..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Employee Name</TableHead>
                  <TableHead>Sick Leave Hours Used</TableHead>
                  <TableHead>Casual Leave Hours Used</TableHead>
                  <TableHead>Remaining Leave Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.length > 0 ? (
                  filteredBalances.map((employee, index) => (
                    <TableRow key={`${employee.name}-${index}`}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.Sick_leave_hours_used}</TableCell>
                      <TableCell>{employee.Casual_leave_hours_used}</TableCell>
                      <TableCell>{employee.Remaining_leave_hours}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {searchTerm ? "No employees match your search" : "No leave balance data available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
