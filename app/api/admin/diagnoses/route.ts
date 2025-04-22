import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()

    // Handle different HTTP methods
    if (req.method === "GET") {
      return handleGetDiagnoses(req, supabase)
    } else if (req.method === "DELETE") {
      return handleDeleteDiagnosis(req, supabase)
    } else {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }
  } catch (error) {
    console.error("Error in admin diagnoses API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

async function handleGetDiagnoses(req: NextRequest, supabase: any) {
  // Get query parameters
  const searchParams = req.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
  const sortBy = searchParams.get("sortBy") || "created_at"
  const sortOrder = searchParams.get("sortOrder") || "desc"
  const hospitalId = searchParams.get("hospitalId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const searchTerm = searchParams.get("search")

  // Calculate offset
  const offset = (page - 1) * limit

  // Start building the query
  let query = supabase.from("diagnoses").select(
    `
    *,
    users (id, full_name, email),
    hospitals (id, name, code)
  `,
    { count: "exact" },
  )

  // Apply filters
  if (hospitalId) {
    query = query.eq("hospital_id", hospitalId)
  }

  if (startDate) {
    query = query.gte("created_at", startDate)
  }

  if (endDate) {
    query = query.lte("created_at", endDate)
  }

  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%,doctor_notes.ilike.%${searchTerm}%`)
  }

  // Apply sorting and pagination
  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    diagnoses: data,
    total: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  })
}

async function handleDeleteDiagnosis(req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()
  const { diagnosisId } = body

  if (!diagnosisId) {
    return NextResponse.json({ error: "Diagnosis ID is required" }, { status: 400 })
  }

  // Get the diagnosis to check for images
  const { data: diagnosis } = await supabase.from("diagnoses").select("image_links").eq("id", diagnosisId).single()

  // Delete any associated images from storage
  if (diagnosis?.image_links && diagnosis.image_links.length > 0) {
    // Extract file paths from URLs
    const filePaths = diagnosis.image_links.map((url: string) => {
      const urlParts = url.split("/")
      return urlParts.slice(urlParts.indexOf("diagnosis-images") + 1).join("/")
    })

    // Delete files from storage
    await supabase.storage.from("diagnosis-images").remove(filePaths)
  }

  // Delete the diagnosis record
  const { error } = await supabase.from("diagnoses").delete().eq("id", diagnosisId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: "Diagnosis deleted successfully",
  })
}

// Export the handler with authentication middleware
export const GET = handler
export const DELETE = handler
