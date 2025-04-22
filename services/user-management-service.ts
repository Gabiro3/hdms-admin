"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateSecurePassword } from "@/lib/utils/password-utils"
import { sendWelcomeEmail } from "@/lib/utils/email-utils"

type UserCreateInput = {
  email: string
  fullName: string
  hospitalId: string
  role?: string
  expertise?: string
  phone?: string
}

type UserUpdateInput = {
  fullName?: string
  hospitalId?: string
  role?: string
  expertise?: string
  phone?: string
  isVerified?: boolean
  isDisabled?: boolean
}

/**
 * Create a new user with a temporary password
 */
export async function createUser(userData: UserCreateInput) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", userData.email).maybeSingle()

    if (existingUser) {
      return { user: null, error: "User with this email already exists" }
    }

    // Generate a temporary password
    const temporaryPassword = generateSecurePassword()

    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: userData.fullName,
        hospital_id: userData.hospitalId,
        role: userData.role || "doctor",
      },
    })

    if (authError) throw authError

    // Then create the user record in our database
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        full_name: userData.fullName,
        email: userData.email,
        hospital_id: userData.hospitalId,
        expertise: userData.expertise || null,
        phone: userData.phone || null,
        is_verified: false, // Requires admin verification
        is_admin: false, // Default to non-admin
        is_disabled: false, // Default to enabled
      })
      .select()
      .single()

    if (error) throw error

    // Send welcome email with temporary password
    await sendWelcomeEmail(userData.email, userData.fullName, temporaryPassword)

    revalidatePath("/admin/users")
    return {
      user: data,
      temporaryPassword,
      error: null,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return { user: null, temporaryPassword: null, error: "Failed to create user" }
  }
}

/**
 * Update a user's information
 */
export async function updateUser(userId: string, userData: UserUpdateInput) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the user record
    const { data, error } = await supabase
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error updating user with ID ${userId}:`, error)
    return { user: null, error: "Failed to update user" }
  }
}

/**
 * Disable a user account
 */
export async function disableUser(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the user record to mark as disabled
    const { data, error } = await supabase
      .from("users")
      .update({
        is_disabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Also disable the auth user
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { disabled: true } })

    if (authError) throw authError

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`Error disabling user with ID ${userId}:`, error)
    return { success: false, error: "Failed to disable user" }
  }
}

/**
 * Enable a previously disabled user account
 */
export async function enableUser(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the user record to mark as enabled
    const { data, error } = await supabase
      .from("users")
      .update({
        is_disabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Also enable the auth user
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { disabled: false },
    })

    if (authError) throw authError

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`Error enabling user with ID ${userId}:`, error)
    return { success: false, error: "Failed to enable user" }
  }
}

/**
 * Reset a user's password and generate a new temporary password
 */
export async function resetUserPassword(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Generate a new temporary password
    const temporaryPassword = generateSecurePassword()

    // Update the user's password
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, { password: temporaryPassword })

    if (authError) throw authError

    // Send email with new temporary password
    await sendWelcomeEmail(userData.email, userData.full_name, temporaryPassword, true)

    return {
      success: true,
      temporaryPassword,
      error: null,
    }
  } catch (error) {
    console.error(`Error resetting password for user with ID ${userId}:`, error)
    return { success: false, temporaryPassword: null, error: "Failed to reset password" }
  }
}

/**
 * Get users with pagination and filtering
 */
export async function getUsers({
  page = 1,
  limit = 10,
  sortBy = "full_name",
  sortOrder = "asc",
  hospitalId = null,
  searchTerm = null,
  isDisabled = null,
  isAdmin = null,
  isVerified = null,
}: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  hospitalId?: string | null
  searchTerm?: string | null
  isDisabled?: boolean | null
  isAdmin?: boolean | null
  isVerified?: boolean | null
}) {
  try {
    const supabase = createServerSupabaseClient()
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

    if (isDisabled !== null) {
      query = query.eq("is_disabled", isDisabled)
    }

    if (isAdmin !== null) {
      query = query.eq("is_admin", isAdmin)
    }

    if (isVerified !== null) {
      query = query.eq("is_verified", isVerified)
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      users: data,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return {
      users: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: "Failed to fetch users",
    }
  }
}

/**
 * Get a user by ID with detailed information
 */
export async function getUserById(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        hospitals (id, name, code)
      `)
      .eq("id", userId)
      .single()

    if (error) throw error

    return { user: data, error: null }
  } catch (error) {
    console.error(`Error fetching user with ID ${userId}:`, error)
    return { user: null, error: "Failed to fetch user" }
  }
}

/**
 * Get user activity metrics
 */
export async function getUserActivityMetrics(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get diagnosis count
    const { count: diagnosisCount, error: diagnosisError } = await supabase
      .from("diagnoses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (diagnosisError) throw diagnosisError

    // Get recent diagnoses (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentDiagnoses, error: recentError } = await supabase
      .from("diagnoses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())

    if (recentError) throw recentError

    // Get login history
    const { data: loginHistory, error: loginError } = await supabase
      .from("user_login_history")
      .select("*")
      .eq("user_id", userId)
      .order("login_time", { ascending: false })
      .limit(10)

    // If the table doesn't exist, we'll just return an empty array
    const logins = loginError ? [] : loginHistory || []

    return {
      diagnosisCount,
      recentDiagnoses,
      loginHistory: logins,
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching activity metrics for user with ID ${userId}:`, error)
    return {
      diagnosisCount: 0,
      recentDiagnoses: 0,
      loginHistory: [],
      error: "Failed to fetch user activity metrics",
    }
  }
}

/**
 * Verify a user (mark as verified)
 */
export async function verifyUser(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error verifying user with ID ${userId}:`, error)
    return { user: null, error: "Failed to verify user" }
  }
}

/**
 * Get all users for a specific hospital
 */
export async function getUsersByHospital(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("users").select("*").eq("hospital_id", hospitalId).order("full_name")

    if (error) throw error

    return { users: data, error: null }
  } catch (error) {
    console.error(`Error fetching users for hospital with ID ${hospitalId}:`, error)
    return { users: [], error: "Failed to fetch hospital users" }
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if user has any diagnoses
    const { count: diagnosisCount, error: countError } = await supabase
      .from("diagnoses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) throw countError

    if (diagnosisCount > 0) {
      return {
        success: false,
        error: `Cannot delete user with ${diagnosisCount} associated diagnoses. Please reassign or delete the diagnoses first.`,
      }
    }

    // Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // Delete the user record from our database
    const { error } = await supabase.from("users").delete().eq("id", userId)
    if (error) throw error

    revalidatePath("/admin/users")
    return { success: true, error: null }
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error)
    return { success: false, error: "Failed to delete user" }
  }
}
