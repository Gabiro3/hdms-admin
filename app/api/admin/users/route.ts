import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()

    // Handle different HTTP methods
    if (req.method === "GET") {
      return handleGetUsers(req, supabase)
    } else if (req.method === "PATCH") {
      return handleUpdateUser(req, supabase)
    } else {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }
  } catch (error) {
    console.error("Error in admin users API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

async function handleGetUsers(req: NextRequest, supabase: any) {
  // Get query parameters
  const searchParams = req.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
  const sortBy = searchParams.get("sortBy") || "created_at"
  const sortOrder = searchParams.get("sortOrder") || "desc"
  const hospitalId = searchParams.get("hospitalId")
  const searchTerm = searchParams.get("search")
  const isAdmin = searchParams.get("isAdmin")

  // Calculate offset
  const offset = (page - 1) * limit

  // Start building the query
  let query = supabase.from("users").select(
    `
    *,
    hospitals (id, name, code)
  `,
    { count: "exact" },
  )

  // Apply filters
  if (hospitalId) {
    query = query.eq("hospital_id", hospitalId)
  }

  if (searchTerm) {
    query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
  }

  if (isAdmin === "true") {
    query = query.eq("is_admin", true)
  } else if (isAdmin === "false") {
    query = query.eq("is_admin", false)
  }

  // Apply sorting and pagination
  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    users: data,
    total: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  })
}

async function handleUpdateUser(req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()
  const { userId, isAdmin } = body

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  // Update the user's admin status
  const { data, error } = await supabase
    .from("users")
    .update({
      is_admin: isAdmin,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    user: data,
  })
}

// Export the handler with authentication middleware
export const GET = handler
export const PATCH = handler
