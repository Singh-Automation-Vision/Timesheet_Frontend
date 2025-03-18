import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Add detailed logging of the received data
    console.log("Received matrices data:", JSON.stringify(data, null, 2))
    console.log("Data type:", typeof data)
    console.log("Email:", data.email)
    console.log("Date:", data.date)
    console.log("Number of criteria received:", Object.keys(data.ratings || {}).length)
    console.log("Criteria received:", Object.keys(data.ratings || {}).join(", "))
    console.log("Values received:", Object.values(data.ratings || {}).join(", "))

    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "matrices.json")

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    let matrices = {}
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      matrices = JSON.parse(fileContent)
    }

    // Use provided email and date or fallback to defaults
    const email = data.email || "test@example.com"
    const date = data.date || new Date().toISOString().split("T")[0]
    const ratings = data.ratings || data // Support both new format and old format

    if (!matrices[email]) {
      matrices[email] = {}
    }

    matrices[email][date] = {
      criteria: ratings,
      red_count: Object.values(ratings).filter((value) => value === "Red").length,
    }

    // Log the data being saved
    console.log(`Saving matrices data for ${email} on ${date}:`, JSON.stringify(matrices[email][date], null, 2))

    fs.writeFileSync(filePath, JSON.stringify(matrices, null, 2))

    console.log(`Matrices saved for ${email} on ${date}`)
    return NextResponse.json({ message: "Matrices saved successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in matrices API:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

