import { API_BASE_URL } from "./api-config"

// Local mock data for fallback
const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin",
    role: "admin",
    country: "India",
    manager: "",
    manager_email: "",
  },
  {
    id: "2",
    name: "Bhargav",
    email: "bhargav",
    password: "BNG",
    role: "user",
    country: "India",
    manager: "Admin User",
    manager_email: "admin",
  },
]

// Fallback login function
export async function fallbackLogin(email: string, password: string) {
  // Simple mock authentication
  const user = mockUsers.find(
    (u) => u.email === email && (u.email === "admin" ? password === "admin" : password === "BNG"),
  )

  if (user) {
    const { password, ...userWithoutPassword } = user as any
    return { user: userWithoutPassword }
  } else {
    throw new Error("Invalid credentials")
  }
}

// Function to determine if we should use fallback
export async function shouldUseFallback() {
  try {
    // Use AbortController to set a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "HEAD",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // If we get any response, the API is accessible
    return false
  } catch (error) {
    console.warn("API appears to be inaccessible, using fallback mode:", error)
    return true // Use fallback
  }
}

