import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "projects.json")

export async function POST(request: Request) {
  try {
    const searchCriteria = await request.json()
    console.log("Searching for project with criteria:", searchCriteria)

    // Read projects from the JSON file
    let projects = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      projects = JSON.parse(fileContent)
    } catch (error) {
      console.error("Error reading projects file:", error)
      return NextResponse.json({ error: "Project database not found" }, { status: 404 })
    }

    // Find the project matching the search criteria
    const project = projects.find((p: any) => {
      const matchesNumber = !searchCriteria.projectNumber || p.projectNumber === searchCriteria.projectNumber
      const matchesName = !searchCriteria.projectName || p.projectName === searchCriteria.projectName

      return matchesNumber && matchesName
    })

    if (!project) {
      console.log("Project not found for criteria:", searchCriteria)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log(`Found project: ${project.projectName}`)
    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error("Error searching for project:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
