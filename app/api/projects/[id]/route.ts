import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "projects.json")

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`Fetching project with ID: ${id}`)

    // Read projects from the JSON file
    let projects = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      projects = JSON.parse(fileContent)
    } catch (error) {
      console.error("Error reading projects file:", error)
      return NextResponse.json({ error: "Project database not found" }, { status: 404 })
    }

    // Find the project with the matching ID
    const project = projects.find((p: any) => p.id === id)
    if (!project) {
      console.log(`Project not found for ID: ${id}`)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log(`Found project: ${project.projectName}`)
    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const projectData = await request.json()
    console.log(`Updating project with ID: ${id}`, projectData)

    // Read projects from the JSON file
    let projects = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      projects = JSON.parse(fileContent)
    } catch (error) {
      console.error("Error reading projects file:", error)
      return NextResponse.json({ error: "Project database not found" }, { status: 404 })
    }

    // Find the project with the matching ID
    const projectIndex = projects.findIndex((p: any) => p.id === id)
    if (projectIndex === -1) {
      console.log(`Project not found for ID: ${id}`)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Update the project data
    const updatedProject = { ...projects[projectIndex], ...projectData }
    projects[projectIndex] = updatedProject

    // Write the updated projects back to the file
    await fs.writeFile(filePath, JSON.stringify(projects, null, 2))

    console.log(`Updated project: ${updatedProject.projectName}`)
    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

