import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const LEAVE_REQUESTS_FILE = path.join(process.cwd(), "data", "leave-requests.json")

// Helper function to read leave requests
function getLeaveRequests() {
  if (!fs.existsSync(LEAVE_REQUESTS_FILE)) {
    // Create the directory if it doesn't exist
    const dir = path.dirname(LEAVE_REQUESTS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(LEAVE_REQUESTS_FILE, JSON.stringify([]), "utf8")
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
  // Create the directory if it doesn't exist
  const dir = path.dirname(LEAVE_REQUESTS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(LEAVE_REQUESTS_FILE, JSON.stringify(leaveRequests, null, 2), "utf8")
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("Received leave request data:", data)

    // Validate required fields - email is now optional
    if (!data.name || !data.startDate || !data.leaveType) {
      console.log("Missing required fields:", {
        name: !!data.name,
        //email: !!data.email,
        startDate: !!data.startDate,
        leaveType: !!data.leaveType,
      })
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const leaveRequests = getLeaveRequests()

    // Create new leave request
    const newLeaveRequest = {
      id: uuidv4(),
      name: data.name,
      //email: data.email || "Not provided", // Make email optional
      days: data.days || 1,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      leaveType: data.leaveType,
      reason: data.reason || "",
      submissionDate: data.submissionDate || new Date().toLocaleDateString(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    }

    leaveRequests.push(newLeaveRequest)
    saveLeaveRequests(leaveRequests)

    return NextResponse.json(
      { message: "Leave request submitted successfully", data: newLeaveRequest },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error submitting leave request:", error)
    return NextResponse.json({ message: "Failed to submit leave request" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const leaveRequests = getLeaveRequests()
    return NextResponse.json(leaveRequests)
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json({ message: "Failed to fetch leave requests" }, { status: 500 })
  }
}
