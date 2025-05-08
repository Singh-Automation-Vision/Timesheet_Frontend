import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcryptjs"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "users.json")

export async function GET(request: Request, { params }: { params: { email: string } }) {
  try {
    const email = params.email
    console.log(`Fetching user with email: ${email}`)

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

    // Find the user with the matching email
    const user = users.find((u: any) => u.email === email)
    if (!user) {
      console.log(`User not found for email: ${email}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create a sanitized user object without the password
    const { password, ...sanitizedUser } = user
    console.log(`Found user: ${user.name}`)

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { email: string } }) {
  try {
    const email = params.email
    const userData = await request.json()
    console.log(`Updating user with email: ${email}`, userData)

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

    // Find the user with the matching email
    const userIndex = users.findIndex((u: any) => u.email === email)
    if (userIndex === -1) {
      console.log(`User not found for email: ${email}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the user data
    const updatedUser = { ...users[userIndex], ...userData }

    // If password is being updated, hash it
    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, 10)
    }

    users[userIndex] = updatedUser

    // Write the updated users back to the file
    await fs.writeFile(filePath, JSON.stringify({ users }, null, 2))

    // Create a sanitized user object without the password
    const { password, ...sanitizedUser } = updatedUser
    console.log(`Updated user: ${updatedUser.name}`)

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
