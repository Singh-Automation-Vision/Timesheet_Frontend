import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Add more detailed logging of the received data
    console.log("Received PM timesheet data (full):", JSON.stringify(data, null, 2))
    console.log("Employee name:", data.employee_name)
    console.log("Date:", data.date || "Using current date")
    console.log("Country:", data.country)
    console.log("Hours structure:", typeof data.hours)
    console.log("Number of hour entries:", Object.keys(data.hours || {}).length)
    console.log("Hour keys:", Object.keys(data.hours || {}).join(", "))

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

    const date = data.date || new Date().toISOString().split("T")[0]
    const email = data.employee_name || "test@example.com" // Use employee name or fallback

    if (!timesheets[email]) {
      timesheets[email] = {}
    }

    if (!timesheets[email][date]) {
      timesheets[email][date] = {}
    }

    // Store PM data - now accepting the full tasks object
    timesheets[email][date].PM = data.hours

    // Update country if not already set
    if (!timesheets[email][date].country) {
      timesheets[email][date].country = data.country
    }

    fs.writeFileSync(filePath, JSON.stringify(timesheets, null, 2))

    console.log(`PM Timesheet saved for ${email} on ${date}`)
    // After saving the data
    console.log(`PM Timesheet saved for ${email} on ${date}:`, JSON.stringify(timesheets[email][date].PM, null, 2))
    return NextResponse.json({ message: "PM Timesheet saved successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in PM timesheet API:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error }, { status: 500 })
  }
}

