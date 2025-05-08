import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "users.json")

export async function GET() {
  try {
    // Try to read the users file
    let users = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      const userData = JSON.parse(fileContent)
      users = Array.isArray(userData) ? userData : userData.users || []
    } catch (error) {
      console.error("Error reading users file:", error)
      return NextResponse.json({ error: "Failed to read users data" }, { status: 500 })
    }

    // Remove sensitive information like passwords
    const sanitizedUsers = users.map((user: any) => {
      const { password, ...sanitizedUser } = user
      return sanitizedUser
    })

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    })
  } catch (error) {
    console.error("Error in showUser API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    )
  }
}
