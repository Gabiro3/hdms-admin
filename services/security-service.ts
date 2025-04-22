"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { headers } from "next/headers"

type FailedLoginAttempt = Database["public"]["Tables"]["failed_login_attempts"]["Insert"]

export async function recordFailedLoginAttempt(email: string) {
  try {
    const supabase = createServerSupabaseClient()
    const headersList = headers()
    const ipAddress = headersList.get("x-forwarded-for") || "unknown"

    const failedAttempt: FailedLoginAttempt = {
      email,
      ip_address: ipAddress,
    }

    const { error } = await supabase.from("failed_login_attempts").insert(failedAttempt)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error(`Error recording failed login attempt for ${email}:`, error)
    return { error: "Failed to record login attempt" }
  }
}

export async function getRecentFailedLoginAttempts(email: string, minutes = 30) {
  try {
    const supabase = createServerSupabaseClient()
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString()

    const { data, error, count } = await supabase
      .from("failed_login_attempts")
      .select("*", { count: "exact" })
      .eq("email", email)
      .gte("attempt_time", cutoffTime)

    if (error) throw error
    return { count: count || 0, attempts: data, error: null }
  } catch (error) {
    console.error(`Error getting failed login attempts for ${email}:`, error)
    return { count: 0, attempts: null, error: "Failed to get login attempts" }
  }
}

export async function clearFailedLoginAttempts(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("failed_login_attempts").delete().eq("email", email)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error(`Error clearing failed login attempts for ${email}:`, error)
    return { error: "Failed to clear login attempts" }
  }
}
