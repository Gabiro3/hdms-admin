"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { recordFailedLoginAttempt, getRecentFailedLoginAttempts, clearFailedLoginAttempts } from "./security-service"
import { updateLastLogin, getUserByEmail } from "./user-service"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const hospitalId = formData.get("hospitalId") as string

  try {
    // Check for too many failed login attempts
    const { count, error: securityError } = await getRecentFailedLoginAttempts(email)
    if (securityError) {
      return { error: "Security check failed" }
    }

    // If too many failed attempts, block login
    if (count >= 5) {
      return { error: "Too many failed login attempts. Please try again later or reset your password." }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Record failed login attempt
      await recordFailedLoginAttempt(email)
      return { error: error.message }
    }

    // Clear any failed login attempts
    await clearFailedLoginAttempts(email)

    // Check if user is disabled
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_disabled, hospital_id")
      .eq("id", data.user.id)
      .single()

    if (userError) {
      return { error: "User profile not found" }
    }

    if (userData.is_disabled) {
      // Sign out the user since they are disabled
      await supabase.auth.signOut()
      return { error: "Your account has been disabled. Please contact your administrator." }
    }

    // Verify hospital ID if provided
    if (hospitalId && userData.hospital_id !== hospitalId) {
      // Sign out the user since they don't have access to this hospital
      await supabase.auth.signOut()
      return { error: "You do not have access to this hospital" }
    }

    // Update last login timestamp
    if (data.user) {
      await updateLastLogin(data.user.id)

      // Record login history if the table exists
      try {
        await supabase.from("user_login_history").insert({
          user_id: data.user.id,
          login_time: new Date().toISOString(),
          ip_address: (await headers()).get("x-forwarded-for") || "unknown",
        })
      } catch (e) {
        // Table might not exist, ignore error
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const hospitalId = formData.get("hospitalId") as string

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          hospital_id: hospitalId,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  ;(await cookies()).delete("supabase-auth-token")
  redirect("/login")
}

export async function resetPassword(email: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { user: null }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { user: null }
    }

    // Get the user's profile from our database
    const { user: profile } = await getUserByEmail(user.email!)

    return {
      user: {
        ...user,
        ...profile,
      },
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return { user: null }
  }
}

/**
 *  {
    console.error("Get current user error:", error)
    return { user: null }
  }
}

/**
 * Check if a user is disabled
 */
export async function isUserDisabled(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("users").select("is_disabled").eq("id", userId).single()

    if (error) throw error

    return { isDisabled: data?.is_disabled || false, error: null }
  } catch (error) {
    console.error(`Error checking disabled status for user with ID ${userId}:`, error)
    return { isDisabled: false, error: "Failed to check user status" }
  }
}

/**
 * Check if user needs to change password (for temporary passwords)
 */
export async function checkPasswordChangeRequired(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user metadata
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error) throw error

    // Check if password change is required in metadata
    const passwordChangeRequired = data.user.user_metadata?.password_change_required || false

    return { passwordChangeRequired, error: null }
  } catch (error) {
    console.error(`Error checking password change requirement for user with ID ${userId}:`, error)
    return { passwordChangeRequired: false, error: "Failed to check password status" }
  }
}

/**
 * Force password change for a user
 */
export async function requirePasswordChange(userId: string, required = true) {
  try {
    const supabase = createServerSupabaseClient()

    // Update user metadata
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { password_change_required: required },
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error(`Error setting password change requirement for user with ID ${userId}:`, error)
    return { success: false, error: "Failed to update password requirements" }
  }
}
