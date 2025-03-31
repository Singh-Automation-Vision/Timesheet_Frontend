import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const projectsFilePath = path.join(dataDir, "projects.json")
const projectMembersFilePath = path.join(dataDir, "project-members.json")

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    console.log("Fetching details for project ID:", projectId)

    // Read projects from file
    let projects = []
    try {
      const fileContent = await fs.readFile(projectsFilePath, "utf-8")
      projects = JSON.parse(fileContent)
    } catch (error) {
      // If the file doesn't exist, create an empty one
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(dataDir, { recursive: true })
        await fs.writeFile(projectsFilePath, JSON.stringify([]), "utf-8")
      } else {
        console.error("Error reading projects file:", error)
        return NextResponse.json({ success: false, error: "Failed to read projects data" }, { status: 500 })
      }
    }

    // Find the requested project
    const project = projects.find(
      (p: any) => p.id === projectId || p.projectNumber === projectId || p.projectName === projectId,
    )

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Read project members from file
    let projectMembers = []
    try {
      const fileContent = await fs.readFile(projectMembersFilePath, "utf-8")
      projectMembers = JSON.parse(fileContent)
    } catch (error) {
      // If the file doesn't exist, create an empty one
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(dataDir, { recursive: true })
        await fs.writeFile(projectMembersFilePath, JSON.stringify([]), "utf-8")
      } else {
        console.error("Error reading project members file:", error)
        return NextResponse.json({ success: false, error: "Failed to read project members data" }, { status: 500 })
      }
    }

    // Filter members for the current project
    const members = projectMembers.filter(
      (m: any) =>
        m.projectId === projectId || m.projectNumber === project.projectNumber || m.projectName === project.projectName,
    )

    // Calculate total hours
    const total_hours = members.reduce((sum: number, member: any) => sum + (member.hours || 0), 0)

    // Return in the modified format
    return NextResponse.json({
      success: true,
      project,
      members: members, // Just the array of members, not a tuple
      total_hours, // Include at top level
    })
  } catch (error) {
    console.error("Error fetching project details:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

