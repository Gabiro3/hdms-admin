import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()

    // Only allow GET method
    if (req.method !== "GET") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const hospitalId = searchParams.get("hospitalId")
    const search = searchParams.get("search")

    // Calculate offset
    const offset = (page - 1) * limit

    // Start building the query
    let query = supabase.from("support_tickets").select(
      `
      *,
      users (
        id, 
        full_name, 
        email,
        hospital_id,
        hospitals (
          id,
          name,
          code
        )
      )
    `,
      { count: "exact" },
    )

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`)
    }

    // Filter by hospital ID (through the users table)
    if (hospitalId) {
      // First get all users from this hospital
      const { data: hospitalUsers } = await supabase.from("users").select("id").eq("hospital_id", hospitalId)

      if (hospitalUsers && hospitalUsers.length > 0) {
        const userIds = hospitalUsers.map((user) => user.id)
        query = query.in("user_id", userIds)
      } else {
        // No users in this hospital, return empty result
        return NextResponse.json({
          tickets: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        })
      }
    }

    // Apply sorting and pagination
    const {
      data: tickets,
      error,
      count,
    } = await query.order(sortBy, { ascending: sortOrder === "asc" }).range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      tickets,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    })
  } catch (error) {
    console.error("Error in admin support tickets API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Export the handler with authentication middleware
export const GET = handler
