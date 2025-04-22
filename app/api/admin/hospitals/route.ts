import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()

    // Handle different HTTP methods
    if (req.method === "GET") {
      return handleGetHospitals(req, supabase)
    } else if (req.method === "POST") {
      return handleCreateHospital(req, supabase)
    } else if (req.method === "PATCH") {
      return handleUpdateHospital(req, supabase)
    } else if (req.method === "DELETE") {
      return handleDeleteHospital(req, supabase)
    } else {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }
  } catch (error) {
    console.error("Error in admin hospitals API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

async function handleGetHospitals(req: NextRequest, supabase: any) {
  // Get query parameters
  const searchParams = req.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
  const sortBy = searchParams.get("sortBy") || "name"
  const sortOrder = searchParams.get("sortOrder") || "asc"
  const searchTerm = searchParams.get("search")

  // Calculate offset
  const offset = (page - 1) * limit

  // Start building the query
  let query = supabase.from("hospitals").select("*", { count: "exact" })

  // Apply search filter
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
  }

  // Apply sorting and pagination
  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    hospitals: data,
    total: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  })
}

async function handleCreateHospital(req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()
  const { name, address, code } = body

  // Validate required fields
  if (!name || !address || !code) {
    return NextResponse.json({ error: "Name, address, and code are required" }, { status: 400 })
  }

  // Check if hospital code already exists
  const { data: existingHospital } = await supabase.from("hospitals").select("id").eq("code", code).single()

  if (existingHospital) {
    return NextResponse.json({ error: "Hospital code already exists" }, { status: 400 })
  }

  // Create the hospital
  const { data, error } = await supabase
    .from("hospitals")
    .insert({
      name,
      address,
      code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    hospital: data,
  })
}

async function handleUpdateHospital(req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()
  const { id, name, address, code } = body

  // Validate required fields
  if (!id || !name || !address || !code) {
    return NextResponse.json({ error: "ID, name, address, and code are required" }, { status: 400 })
  }

  // Check if hospital exists
  const { data: existingHospital } = await supabase.from("hospitals").select("id").eq("id", id).single()

  if (!existingHospital) {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 })
  }

  // Update the hospital
  const { data, error } = await supabase
    .from("hospitals")
    .update({
      name,
      address,
      code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    hospital: data,
  })
}

async function handleDeleteHospital(req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()
  const { hospitalId } = body

  if (!hospitalId) {
    return NextResponse.json({ error: "Hospital ID is required" }, { status: 400 })
  }

  // Check if hospital has associated users or diagnoses
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)

  if (userCount > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete hospital with associated users. Please reassign or delete users first.",
      },
      { status: 400 },
    )
  }

  const { count: diagnosisCount } = await supabase
    .from("diagnoses")
    .select("*", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)

  if (diagnosisCount > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete hospital with associated diagnoses. Please reassign or delete diagnoses first.",
      },
      { status: 400 },
    )
  }

  // Delete the hospital
  const { error } = await supabase.from("hospitals").delete().eq("id", hospitalId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: "Hospital deleted successfully",
  })
}

// Export the handler with authentication middleware
export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
