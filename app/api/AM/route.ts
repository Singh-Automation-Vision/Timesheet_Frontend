import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Add more detailed logging of the received data
    console.log("Received AM timesheet data (full):", JSON.stringify(data, null, 2))
    console.log("Employee name:", data.employee_name)
    console.log("Date:", data.date)
    console.log("Period:", data.period)
    console.log("Country:", data.country)
    console.log("Tasks structure:", typeof data.tasks)
    console.log("Number of tasks:", Object.keys(data.tasks || {}).length)
    console.log("Task hours:", Object.keys(data.tasks || {}).join(", "))

    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "timesheets.json")

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    let timesheets = {}
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      timesheets = JSON.parse(fileContent)
    }

    const date = new Date().toISOString().split("T")[0]
    const email = data.employee_name || "test@example.com" // Use employee name or fallback

    if (!timesheets[email]) {
      timesheets[email] = {}
    }

    if (!timesheets[email][date]) {
      timesheets[email][date] = {}
    }

    // Store AM data
    timesheets[email][date].AM = data.tasks
    timesheets[email][date].country = data.country

    // Log the data being saved
    console.log(`Saving AM timesheet for ${email} on ${date}:`, JSON.stringify(timesheets[email][date].AM, null, 2))

    fs.writeFileSync(filePath, JSON.stringify(timesheets, null, 2))

    console.log(`AM Timesheet saved for ${email} on ${date}`)
    return NextResponse.json({ message: "AM Timesheet saved successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in AM timesheet API:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

