import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Define the path to the leave data JSON file
const LEAVE_DATA_FILE = path.join(process.cwd(), "data", "leave-data.json")

// Initialize leave data file if it doesn't exist
function initializeLeaveData() {
  if (!fs.existsSync(LEAVE_DATA_FILE)) {
    const dir = path.dirname(LEAVE_DATA_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Create default leave data with some sample users
    const defaultData = {
      users: [
        { name: "John Doe", totalLeaves: 20, usedLeaves: 5 },
        { name: "Jane Smith", totalLeaves: 20, usedLeaves: 8 },
        // Add more default users if needed
      ],
      defaultTotalLeaves: 20, // Default total leaves for new users
    }

    fs.writeFileSync(LEAVE_DATA_FILE, JSON.stringify(defaultData, null, 2), "utf8")
    return defaultData
  }

  try {
    const data = fs.readFileSync(LEAVE_DATA_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading leave data:", error)
    return { users: [], defaultTotalLeaves: 20 }
  }
}

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const userName = params.name
    if (!userName) {
      return NextResponse.json({ error: "User name is required" }, { status: 400 })
    }

    // Get leave data
    const leaveData = initializeLeaveData()

    // Find user in leave data
    let userData = leaveData.users.find((user) => user.name === userName)

    // If user doesn't exist, create a new entry
    if (!userData) {
      userData = {
        name: userName,
        totalLeaves: leaveData.defaultTotalLeaves,
        usedLeaves: 0,
      }

      // Add user to leave data
      leaveData.users.push(userData)

      // Save updated leave data
      fs.writeFileSync(LEAVE_DATA_FILE, JSON.stringify(leaveData, null, 2), "utf8")
    }

    // Calculate remaining leaves
    const remainingLeaves = userData.totalLeaves - userData.usedLeaves

    return NextResponse.json({
      name: userData.name,
      totalLeaves: userData.totalLeaves,
      usedLeaves: userData.usedLeaves,
      remainingLeaves,
    })
  } catch (error) {
    console.error("Error getting leave data:", error)
    return NextResponse.json({ error: "Failed to get leave data" }, { status: 500 })
  }
}
