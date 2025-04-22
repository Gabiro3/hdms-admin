import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const hospitalId = searchParams.get("hospitalId")
    const userId = searchParams.get("userId")

    // Build the query
    let query = supabase.from("diagnoses").select(`
        *,
        users (id, full_name, email),
        hospitals (id, name, code)
      `)

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    // Execute the query
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching diagnoses:", error)
      return NextResponse.json({ error: "Failed to fetch diagnoses" }, { status: 500 })
    }

    return NextResponse.json({ diagnoses: data })
  } catch (error) {
    console.error("Error in diagnoses API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { title, doctorNotes, patientId, hospitalId } = body

    if (!title || !patientId || !hospitalId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the diagnosis
    const { data, error } = await supabase
      .from("diagnoses")
      .insert({
        title,
        doctor_notes: doctorNotes,
        patient_id: patientId,
        hospital_id: hospitalId,
        user_id: session.user.id,
        image_links: [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating diagnosis:", error)
      return NextResponse.json({ error: "Failed to create diagnosis" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      diagnosis: data,
    })
  } catch (error) {
    console.error("Error in create diagnosis API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
