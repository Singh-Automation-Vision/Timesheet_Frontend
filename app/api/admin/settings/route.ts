import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const settings = await request.json()
    const dataDir = path.join(process.cwd(), "data")
    const settingsPath = path.join(dataDir, "settings.json")

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    const settingsPath = path.join(dataDir, "settings.json")

    if (!fs.existsSync(settingsPath)) {
      return NextResponse.json({
        companyName: "Singh Automation",
        emailNotifications: true,
        defaultTimeZone: "UTC",
      })
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

