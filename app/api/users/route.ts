import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "users.json")

const initializeUsers = async () => {
  console.log("Initializing users...")
  const adminPassword = await bcrypt.hash("admin", 10)
  const bhargavPassword = await bcrypt.hash("BNG", 10)
  const initialUsers = [
    {
      id: uuidv4(),
      name: "Admin User",
      email: "admin",
      password: adminPassword,
      role: "admin",
      country: "India",
      manager: "",
      manager_email: "",
    },
    {
      id: uuidv4(),
      name: "Bhargav",
      email: "bhargav",
      password: bhargavPassword,
      role: "user",
      country: "India",
      manager: "Admin User",
      manager_email: "admin",
    },
  ]
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(initialUsers, null, 2))
  console.log("Users initialized:", initialUsers)
  return initialUsers
}

export async function GET() {
  try {
    let users
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      users = JSON.parse(fileContent)
      console.log("Existing users found:", users)
    } catch (error) {
      console.log("Users file does not exist or is invalid, initializing...")
      users = await initializeUsers()
    }
    const sanitizedUsers = users.map((user: any) => {
      const { password, ...sanitizedUser } = user
      return sanitizedUser
    })
    console.log("Returning sanitized users:", sanitizedUsers)
    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    console.log("Adding new user:", userData)
    let users = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      users = JSON.parse(fileContent).users
    } catch (error) {
      users = await initializeUsers()
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const newUser = {
      id: uuidv4(),
      ...userData,
      password: hashedPassword,
    }

    users.push(newUser)
    await fs.writeFile(filePath, JSON.stringify({ users }, null, 2))

    const { password, ...sanitizedUser } = newUser
    console.log("New user added:", sanitizedUser)
    return NextResponse.json({ message: "User added successfully", user: sanitizedUser })
  } catch (error) {
    console.error("Error adding user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

