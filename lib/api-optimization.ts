// Cache for API responses
const API_CACHE: Record<string, { data: any; timestamp: number }> = {}
const CACHE_DURATION = 60000 // 1 minute cache

// Function to fetch with caching
export async function fetchWithCache(url: string, options?: RequestInit) {
  const cacheKey = `${url}-${JSON.stringify(options?.body || {})}`

  // Check if we have a valid cached response
  const cachedResponse = API_CACHE[cacheKey]
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    return { data: cachedResponse.data, fromCache: true }
  }

  // No cache or expired, make the actual fetch
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Cache the response
    API_CACHE[cacheKey] = {
      data,
      timestamp: Date.now(),
    }

    return { data, fromCache: false }
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

// Clear cache for specific endpoints or all
export function clearApiCache(urlPattern?: string) {
  if (!urlPattern) {
    // Clear all cache
    Object.keys(API_CACHE).forEach((key) => delete API_CACHE[key])
    return
  }

  // Clear cache for specific pattern
  Object.keys(API_CACHE).forEach((key) => {
    if (key.includes(urlPattern)) {
      delete API_CACHE[key]
    }
  })
}

// Batch API requests to reduce network calls
export async function batchRequests(requests: Array<{ url: string; options?: RequestInit }>) {
  return Promise.all(requests.map((request) => fetchWithCache(request.url, request.options)))
}
