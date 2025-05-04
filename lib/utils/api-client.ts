import { getAuthToken } from "@/lib/supabase/client"

type RequestOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
}

/**
 * Makes an authenticated API request to our backend
 */
export async function apiRequest(url: string, options: RequestOptions = {}) {
  // Get the auth token
  const token = await getAuthToken()

  // Prepare headers with authentication
  const headers: Record<string, string> = {
    ...options.headers,
  }

  // Add auth token if available
  if (token) {
    headers["Authorization"] = token
  }

  // Handle JSON body if provided
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  // Make the request
  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
  })

  // Handle unauthorized errors
  if (response.status === 401) {
    // Optionally redirect to login or handle session expiration
    console.error("Authentication error: Session expired or invalid")
    // You could redirect to login here if needed
    // window.location.href = "/login"
  }

  return response
}

/**
 * Helper for FormData submissions with authentication
 */
export async function submitFormData(url: string, formData: FormData) {
  const token = await getAuthToken()

  const headers: Record<string, string> = {}
  if (token) {
    headers["Authorization"] = token
  }

  return fetch(url, {
    method: "POST",
    headers,
    body: formData,
  })
}
