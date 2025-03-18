import { API_BASE_URL } from "./api-config"

export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
      cache: "no-cache",
    })

    if (response.ok) {
      return { status: "ok", message: "API is accessible" }
    } else {
      return {
        status: "error",
        message: `API returned status ${response.status}`,
      }
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

