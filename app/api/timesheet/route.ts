import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const data = await request.json()
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
    const email = "test@example.com" // In a real app, get this from the authenticated user

    if (!timesheets[email]) {
      timesheets[email] = {}
    }

    if (!timesheets[email][date]) {
      timesheets[email][date] = {}
    }

    if (data.AM && !timesheets[email][date].AM) {
      timesheets[email][date].AM = data.AM
    } else if (data.PM && !timesheets[email][date].PM) {
      timesheets[email][date].PM = data.PM
    } else {
      return NextResponse.json({ error: "Timesheet already submitted for this period" }, { status: 400 })
    }

    fs.writeFileSync(filePath, JSON.stringify(timesheets, null, 2))

    console.log(`Timesheet saved for ${email} on ${date}`)
    return NextResponse.json({ message: "Timesheet saved successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in timesheet API:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error }, { status: 500 })
  }
}
