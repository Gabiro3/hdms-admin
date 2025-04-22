import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"
import { generateSecurePassword } from "@/lib/utils/password-utils"
import { sendWelcomeEmail } from "@/lib/utils/email-utils"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()
    const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!data?.is_admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Only allow POST method
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    // Parse the request body
    const body = await req.json()
    const { email, fullName, hospitalId, role, expertise, phone } = body

    // Validate required fields
    if (!email || !fullName || !hospitalId) {
      return NextResponse.json({ error: "Email, full name, and hospital ID are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate a temporary password
    const temporaryPassword = generateSecurePassword()

    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: fullName,
        hospital_id: hospitalId,
        role: role || "doctor",
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Then create the user record in our database
    const { data: userData, error } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        full_name: fullName,
        email,
        hospital_id: hospitalId,
        expertise: expertise || null,
        phone: phone || null,
        is_verified: false, // Requires admin verification
        is_admin: false, // Default to non-admin
        is_disabled: false, // Default to enabled
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send welcome email with temporary password
    await sendWelcomeEmail(email, fullName, temporaryPassword)

    return NextResponse.json({
      success: true,
      user: userData,
      temporaryPassword,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Export the handler with authentication middleware
export const POST = handler
