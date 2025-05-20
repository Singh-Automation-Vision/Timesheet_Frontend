import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const safetyData = await request.json()

    // Log the data that would be sent to the backend
    console.log("Sending safety data to backend:", JSON.stringify(safetyData, null, 2))

    // For now, we'll simulate a successful response
    const simulatedBackendResponse = {
      success: true,
      message: "Safety checklist received and processed successfully",
      checklist_id: `safety-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    // Return a success response
    return NextResponse.json(simulatedBackendResponse)
  } catch (error) {
    console.error("Error in safety API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process safety checklist",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeName = url.searchParams.get("employee_name")
    const startDate = url.searchParams.get("start_date")
    const endDate = url.searchParams.get("end_date")

    console.log("Safety GET request params:", { employeeName, startDate, endDate })

    // In a real implementation, you would fetch this data from your backend
    // For example:
    /*
    let apiUrl = 'https://your-backend-api.com/safety-checklists';
    
    if (employeeName && startDate && endDate) {
      apiUrl += `?employee_name=${employeeName}&start_date=${startDate}&end_date=${endDate}`;
    } else if (employeeName) {
      apiUrl += `?employee_name=${employeeName}`;
    }
    
    const backendResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Bearer your-auth-token'
      }
    });
    
    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status: ${backendResponse.status}`);
    }
    
    const safetyData = await backendResponse.json();
    */

    // For now, we'll return simulated data
    // Check if we have all required parameters
    if (!employeeName || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters: employee_name, start_date, and end_date are required",
        },
        { status: 400 },
      )
    }

    // Sample safety questions
    const safetyQuestions = [
      "Are you wearing all required Personal Protective Equipment (PPE) for your task today?",
      "Have you inspected your tools, machines, or equipment for any visible damage or malfunction?",
      "Is your work area clean, organized, and free from slip/trip hazards?",
      "Are all emergency stop buttons and safety interlocks functional and accessible?",
      "Are all wires, cables, and hoses properly managed to avoid entanglement or tripping?",
      "Have you seen or experienced anything unsafe today that should be reported?",
      "Have you reviewed and acknowledged today's safety briefing or posted instructions?",
    ]

    // Parse dates
    const start = new Date(startDate.split("-").reverse().join("-"))
    const end = new Date(endDate.split("-").reverse().join("-"))

    // Generate entries for each day in the range
    const entries = []
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}-${currentDate.getFullYear()}`

      // Create safety_matrix object with questions and random Green/Red ratings
      const safety_matrix: Record<string, string> = {}
      safetyQuestions.forEach((question) => {
        safety_matrix[question] = Math.random() > 0.3 ? "Green" : "Red"
      })

      // Create an entry with the format matching the API response
      entries.push({
        date: formattedDate,
        employee_name: employeeName,
        shift: "IND", // Example shift value
        safety_matrix: safety_matrix,
      })

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const simulatedData = {
      success: true,
      message: "Safety checklist data retrieved successfully",
      data: entries,
    }

    return NextResponse.json(simulatedData)
  } catch (error) {
    console.error("Error in safety API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve safety data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
