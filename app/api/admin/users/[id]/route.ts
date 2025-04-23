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

    // Get the user ID from the URL
    const userId = req.nextUrl.pathname.split("/").pop()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Handle different HTTP methods
    if (req.method === "GET") {
      return handleGetUser(userId, supabase)
    } else if (req.method === "PATCH") {
      return handleUpdateUser(userId, req, supabase)
    } else if (req.method === "DELETE") {
      return handleDeleteUser(userId, supabase)
    } else {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }
  } catch (error) {
    console.error("Error in admin user API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

async function handleGetUser(userId: string, supabase: any) {
  // Get the user
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(`
      *,
      hospitals (id, name, code)
    `)
    .eq("id", userId)
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 404 })
  }

  // Get user's support tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get user's diagnoses count
  const { count: diagnosesCount, error: diagnosesError } = await supabase
    .from("diagnoses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  return NextResponse.json({
    user: userData,
    supportTickets: tickets || [],
    diagnosesCount: diagnosesCount || 0,
  })
}

async function handleUpdateUser(userId: string, req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()

  // Check if user exists
  const { data: existingUser, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("id", userId)
    .single()

  if (userError) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Handle different update operations
  if (body.operation === "disable") {
    // Disable the user
    const { error } = await supabase
      .from("users")
      .update({
        is_disabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update the auth user metadata
    await supabase.auth.admin.updateUserById(userId, { user_metadata: { disabled: true } })

    return NextResponse.json({
      success: true,
      message: "User disabled successfully",
    })
  } else if (body.operation === "enable") {
    // Enable the user
    const { error } = await supabase
      .from("users")
      .update({
        is_disabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update the auth user metadata
    await supabase.auth.admin.updateUserById(userId, { user_metadata: { disabled: false } })

    return NextResponse.json({
      success: true,
      message: "User enabled successfully",
    })
  } else if (body.operation === "resetPassword") {
    // Generate a new temporary password
    const temporaryPassword = generateSecurePassword()

    // Update the user's password
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, { password: temporaryPassword })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Send email with new temporary password
    await sendWelcomeEmail(existingUser.email, existingUser.full_name, temporaryPassword, true)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      temporaryPassword,
    })
  } else {
    // Regular update
    const updateData: any = {}

    // Only include fields that are provided
    if (body.fullName !== undefined) updateData.full_name = body.fullName
    if (body.hospitalId !== undefined) updateData.hospital_id = body.hospitalId
    if (body.expertise !== undefined) updateData.expertise = body.expertise
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.isVerified !== undefined) updateData.is_verified = body.isVerified
    if (body.isAdmin !== undefined) updateData.is_admin = body.isAdmin

    updateData.updated_at = new Date().toISOString()

    // Update the user
    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data,
    })
  }
}

async function handleDeleteUser(userId: string, supabase: any) {
  // Check if user has any diagnoses
  const { count: diagnosisCount, error: countError } = await supabase
    .from("diagnoses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  if (diagnosisCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete user with ${diagnosisCount} associated diagnoses. Please reassign or delete the diagnoses first.`,
      },
      { status: 400 },
    )
  }

  // Delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Delete the user record from our database
  const { error } = await supabase.from("users").delete().eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: "User deleted successfully",
  })
}

// Export the handler with authentication middleware
export const GET = handler
export const PATCH = handler
export const DELETE = handler
