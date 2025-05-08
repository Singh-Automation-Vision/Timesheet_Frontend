import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcryptjs"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "users.json")

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log(`Login attempt for email: ${email}`)

    // Read users from the JSON file
    let users = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      const data = JSON.parse(fileContent)
      users = Array.isArray(data) ? data : data.users || []
      console.log(`Found ${users.length} users in the database`)
    } catch (error) {
      console.error("Error reading users file:", error)
      return NextResponse.json({ error: "User database not found" }, { status: 404 })
    }

    // Find the user with the matching email
    const user = users.find((u: any) => u.email === email)
    if (!user) {
      console.log(`User not found for email: ${email}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      console.log(`Password mismatch for email: ${email}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create a sanitized user object without the password
    const { password: _, ...sanitizedUser } = user
    console.log(`Successful login for user: ${user.name}`)

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
