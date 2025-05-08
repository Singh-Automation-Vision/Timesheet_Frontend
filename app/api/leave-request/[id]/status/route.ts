import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const LEAVE_REQUESTS_FILE = path.join(process.cwd(), "data", "leave-requests.json")

// Helper function to read leave requests
function getLeaveRequests() {
  if (!fs.existsSync(LEAVE_REQUESTS_FILE)) {
    return []
  }

  const data = fs.readFileSync(LEAVE_REQUESTS_FILE, "utf8")
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error("Error parsing leave requests JSON:", e)
    return []
  }
}

// Helper function to write leave requests
function saveLeaveRequests(leaveRequests: any[]) {
  const dir = path.dirname(LEAVE_REQUESTS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(LEAVE_REQUESTS_FILE, JSON.stringify(leaveRequests, null, 2), "utf8")
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const leaveRequests = getLeaveRequests()

    const leaveRequest = leaveRequests.find((req: any) => req.id === id)

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    return NextResponse.json(leaveRequest)
  } catch (error) {
    console.error("Error fetching leave request:", error)
    return NextResponse.json({ error: "Failed to fetch leave request" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { status } = await request.json()

    if (!status || !["Approved", "Rejected", "Pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const leaveRequests = getLeaveRequests()
    const index = leaveRequests.findIndex((req: any) => req.id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    // Update the status
    leaveRequests[index].status = status

    // Save the updated leave requests
    saveLeaveRequests(leaveRequests)

    return NextResponse.json({ message: "Status updated successfully", leaveRequest: leaveRequests[index] })
  } catch (error) {
    console.error("Error updating leave request status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
