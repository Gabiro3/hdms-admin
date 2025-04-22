import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Authenticates a request using the Authorization header
 * Returns the user session if authenticated, null otherwise
 */
export async function authenticateRequest(req: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "Missing or invalid Authorization header" }
    }

    const token = authHeader.split(" ")[1]

    // Create a Supabase client
    const supabase = createServerSupabaseClient()

    // Verify the token
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return { user: null, error: error?.message || "Invalid token" }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return { user: null, error: "Authentication failed" }
  }
}

/**
 * Middleware to protect API routes
 */
export function withAuth(handler: Function) {
  return async (req: NextRequest) => {
    const { user, error } = await authenticateRequest(req)

    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Add the user to the request object
    return handler(req, user)
  }
}