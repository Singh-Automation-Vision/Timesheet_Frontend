import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: Request, { params }: { params: { username: string; date: string } }) {
  try {
    const { username, date } = params

    // Log the original date format received
    console.log("API: Original date format received:", date)

    // No need to convert the date format anymore since we're using the original format
    // If needed, you can convert here for internal processing

    console.log("API: Fetching timesheet for user:", username)
    console.log("API: Date requested:", date)

    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "timesheets.json")
    console.log("API: Looking for timesheet data at:", filePath)

    if (!fs.existsSync(filePath)) {
      console.log("API: Timesheet data file not found")
      return NextResponse.json({ error: "No timesheet data found" }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    console.log("API: Timesheet data file found and read")

    const timesheets = JSON.parse(fileContent)
    console.log("API: Available usernames in data:", Object.keys(timesheets))
    console.log("API: Requested username:", username)
    console.log("API: Requested date:", date)

    // Check if there's data for this user
    if (!timesheets[username]) {
      console.log("API: No data found for username:", username)
      return NextResponse.json({ error: "No timesheet found for this user" }, { status: 404 })
    }

    console.log("API: Available dates for user:", Object.keys(timesheets[username]))

    // Check if there's data for this date
    if (!timesheets[username][date]) {
      console.log("API: No data found for date:", date)
      return NextResponse.json({ error: "No timesheet found for this date" }, { status: 404 })
    }

    console.log("API: Found timesheet data for user and date")
    console.log("API: Data structure:", JSON.stringify(timesheets[username][date], null, 2))
    console.log("API: AM data:", timesheets[username][date].AM ? "Present" : "Not present")
    console.log("API: PM data:", timesheets[username][date].PM ? "Present" : "Not present")
    console.log("API: Country:", timesheets[username][date].country || "Not specified")

    // Return the timesheet data
    return NextResponse.json(timesheets[username][date])
  } catch (error) {
    console.error("API: Error fetching timesheet:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

