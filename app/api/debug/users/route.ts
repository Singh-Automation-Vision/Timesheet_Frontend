import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcryptjs"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "users.json")

export async function GET() {
  try {
    // Read users from the JSON file
    let users = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      const data = JSON.parse(fileContent)
      users = Array.isArray(data) ? data : data.users || []
    } catch (error) {
      console.error("Error reading users file:", error)
      return NextResponse.json({ error: "User database not found" }, { status: 404 })
    }

    // Return all users with their passwords (for debugging only)
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { users } = await request.json()
    console.log(`Updating all users: ${users.length} users`)

    // Hash passwords if they are not already hashed
    const processedUsers = await Promise.all(
      users.map(async (user: any) => {
        if (user.password && !user.password.startsWith("$2")) {
          user.password = await bcrypt.hash(user.password, 10)
        }
        return user
      }),
    )

    // Write the updated users back to the file
    await fs.writeFile(filePath, JSON.stringify({ users: processedUsers }, null, 2))

    return NextResponse.json({ message: "Users updated successfully" })
  } catch (error) {
    console.error("Error updating users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
