import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "projects.json")

export async function POST(request: Request) {
  try {
    const { projectNumber, projectName } = await request.json()
    console.log(`Deleting project with number: ${projectNumber} and name: ${projectName}`)

    // Read projects from the JSON file
    let projects = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      projects = JSON.parse(fileContent)
    } catch (error) {
      console.error("Error reading projects file:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Project database not found",
        },
        { status: 404 },
      )
    }

    // Find the project with the matching number and name
    const initialLength = projects.length
    projects = projects.filter(
      (project: any) => project.projectNumber !== projectNumber || project.projectName !== projectName,
    )

    if (projects.length === initialLength) {
      console.log(`Project not found with number: ${projectNumber} and name: ${projectName}`)
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    // Write the updated projects back to the file
    await fs.writeFile(filePath, JSON.stringify(projects, null, 2))

    console.log(`Project deleted with number: ${projectNumber} and name: ${projectName}`)
    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    )
  }
}

