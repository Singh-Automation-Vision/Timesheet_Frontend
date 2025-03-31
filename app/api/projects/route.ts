import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "projects.json")

// Initialize projects file if it doesn't exist
const initializeProjects = async () => {
  console.log("Initializing projects...")
  const initialProjects = []
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(initialProjects, null, 2))
  console.log("Projects initialized:", initialProjects)
  return initialProjects
}

export async function GET() {
  try {
    let projects = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      projects = JSON.parse(fileContent)
      console.log("Existing projects found:", projects)
    } catch (error) {
      console.log("Projects file does not exist or is invalid, initializing...")
      projects = await initializeProjects()
    }

    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const projectData = await request.json()
    console.log("Adding new project:", projectData)

    let projects = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      projects = JSON.parse(fileContent)
    } catch (error) {
      projects = await initializeProjects()
    }

    const newProject = {
      id: uuidv4(),
      ...projectData,
      createdAt: new Date().toISOString(),
    }

    projects.push(newProject)
    await fs.writeFile(filePath, JSON.stringify(projects, null, 2))

    console.log("New project added:", newProject)
    return NextResponse.json({
      success: true,
      message: "Project added successfully",
      project: newProject,
    })
  } catch (error) {
    console.error("Error adding project:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    )
  }
}

