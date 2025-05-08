import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "timesheets.json")

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ amSubmitted: false, pmSubmitted: false }, { status: 200 })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    const timesheets = JSON.parse(fileContent)

    const date = new Date().toISOString().split("T")[0]
    const email = "test@example.com" // In a real app, get this from the authenticated user

    // Check if AM data exists
    const amSubmitted = timesheets[email]?.[date]?.AM !== undefined

    // Check if PM data exists (now it's an array)
    const pmData = timesheets[email]?.[date]?.PM
    const pmSubmitted = pmData !== undefined && Array.isArray(pmData) && pmData.length > 0

    return NextResponse.json({ amSubmitted, pmSubmitted }, { status: 200 })
  } catch (error) {
    console.error("Error checking timesheet status:", error)
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 })
  }
}
