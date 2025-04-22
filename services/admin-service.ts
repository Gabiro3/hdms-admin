"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { format, subMonths, startOfDay, endOfDay, eachDayOfInterval } from "date-fns"

/**
 * Get all diagnoses with pagination and filtering options
 */
export async function getAllDiagnoses({
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  hospitalId = null,
  startDate = null,
  endDate = null,
  searchTerm = null,
}: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  hospitalId?: string | null
  startDate?: string | null
  endDate?: string | null
  searchTerm?: string | null
}) {
  const cookieStore = await cookies()
  try {
    const supabase = createBrowserSupabaseClient()
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
      query = query.or(
        `title.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%,doctor_notes.ilike.%${searchTerm}%`,
      )
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      diagnoses: data,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching all diagnoses:", error)
    return {
      diagnoses: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: "Failed to fetch diagnoses",
    }
  }
}

/**
 * Get system-wide statistics for the admin dashboard
 */
export async function getSystemStats() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get total diagnoses
    const { count: totalDiagnoses, error: diagnosesError } = await supabase
      .from("diagnoses")
      .select("*", { count: "exact", head: true })

    if (diagnosesError) throw diagnosesError

    // Get total hospitals
    const { count: totalHospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("*", { count: "exact", head: true })

    if (hospitalsError) throw hospitalsError

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) throw usersError

    // Get unique patients count (based on patient_id in diagnoses)
    const { data: uniquePatients, error: patientsError } = await supabase
      .from("diagnoses")
      .select("patient_id")
      .limit(1000) // Adjust as needed

    if (patientsError) throw patientsError

    // Count unique patient IDs
    const uniquePatientIds = new Set(uniquePatients.map((d) => d.patient_id))
    const totalPatients = uniquePatientIds.size

    // Count total images by summing the length of image_links arrays
    const { data: diagnosesWithImages, error: imagesError } = await supabase
      .from("diagnoses")
      .select("image_links")
      .not("image_links", "is", null)

    if (imagesError) throw imagesError

    let totalImages = 0
    diagnosesWithImages.forEach((diagnosis) => {
      if (diagnosis.image_links) {
        totalImages += diagnosis.image_links.length
      }
    })

    // Get recent diagnoses (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentDiagnoses, error: recentError } = await supabase
      .from("diagnoses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    if (recentError) throw recentError

    return {
      totalDiagnoses,
      totalHospitals,
      totalUsers,
      totalPatients,
      totalImages,
      recentDiagnoses,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching system stats:", error)
    return {
      error: "Failed to fetch system statistics",
    }
  }
}

/**
 * Get the most common diagnosis types and their counts
 */
export async function getMostCommonDiagnosisTypes(limit = 5) {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all diagnoses
    const { data: diagnoses, error } = await supabase.from("diagnoses").select("title, patient_metadata")

    if (error) throw error

    // Extract diagnosis types from titles and metadata
    const typeCounts: Record<string, number> = {}

    diagnoses.forEach((diagnosis) => {
      // Try to get scan type from patient_metadata
      let type = diagnosis.patient_metadata?.scan_type

      // If not available, try to extract from title
      if (!type) {
        const match = diagnosis.title.match(/(CT|MRI|X-Ray|Ultrasound|PET|Mammogram)/i)
        if (match) {
          type = match[0].toUpperCase()
        } else {
          type = "Other"
        }
      }

      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    // Convert to array and sort by count
    const sortedTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return {
      diagnosisTypes: sortedTypes,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching common diagnosis types:", error)
    return {
      diagnosisTypes: [],
      error: "Failed to fetch common diagnosis types",
    }
  }
}

/**
 * Get time-series data for diagnoses over time
 */
export async function getDiagnosisTimeSeriesData(
  timeRange: "7days" | "30days" | "90days" | "6months" | "1year" = "30days",
) {
  try {
    const supabase = createBrowserSupabaseClient()
    const today = new Date()
    let startDate: Date

    // Determine the start date based on the time range
    switch (timeRange) {
      case "7days":
        startDate = subMonths(today, 0.25) // ~7 days
        break
      case "30days":
        startDate = subMonths(today, 1)
        break
      case "90days":
        startDate = subMonths(today, 3)
        break
      case "6months":
        startDate = subMonths(today, 6)
        break
      case "1year":
        startDate = subMonths(today, 12)
        break
      default:
        startDate = subMonths(today, 1) // Default to 30 days
    }

    // Get all diagnoses within the date range
    const { data: diagnoses, error } = await supabase
      .from("diagnoses")
      .select("created_at")
      .gte("created_at", startOfDay(startDate).toISOString())
      .lte("created_at", endOfDay(today).toISOString())
      .order("created_at", { ascending: true })

    if (error) throw error

    // Generate date range for the time series
    const dateRange = eachDayOfInterval({ start: startDate, end: today })

    // Initialize counts for each day
    const dailyCounts = dateRange.reduce<Record<string, number>>((acc, date) => {
      acc[format(date, "yyyy-MM-dd")] = 0
      return acc
    }, {})

    // Count diagnoses per day
    diagnoses.forEach((diagnosis) => {
      const date = format(new Date(diagnosis.created_at), "yyyy-MM-dd")
      if (dailyCounts[date] !== undefined) {
        dailyCounts[date]++
      }
    })

    // Convert to time series format
    const timeSeriesData = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }))

    return {
      timeSeriesData,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching diagnosis time series data:", error)
    return {
      timeSeriesData: [],
      error: "Failed to fetch diagnosis time series data",
    }
  }
}

/**
 * Get hospital performance metrics
 */
export async function getHospitalPerformanceMetrics() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all hospitals
    const { data: hospitals, error: hospitalsError } = await supabase.from("hospitals").select("id, name, code")

    if (hospitalsError) throw hospitalsError

    // For each hospital, get diagnosis count and other metrics
    const hospitalMetrics = await Promise.all(
      hospitals.map(async (hospital) => {
        // Get total diagnoses for this hospital
        const { count: diagnosisCount, error: diagnosisError } = await supabase
          .from("diagnoses")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospital.id)

        if (diagnosisError) throw diagnosisError

        // Get total users for this hospital
        const { count: userCount, error: userError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospital.id)

        if (userError) throw userError

        // Get recent diagnoses (last 30 days) for this hospital
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: recentDiagnoses, error: recentError } = await supabase
          .from("diagnoses")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospital.id)
          .gte("created_at", thirtyDaysAgo.toISOString())

        if (recentError) throw recentError

        // Calculate activity score (simple metric based on recent diagnoses)
        const activityScore = recentDiagnoses && recentDiagnoses > 0 && diagnosisCount 
          ? (recentDiagnoses / diagnosisCount) * 100 
          : 0

        return {
          id: hospital.id,
          name: hospital.name,
          code: hospital.code,
          diagnosisCount,
          userCount,
          recentDiagnoses,
          activityScore: Math.min(Math.round(activityScore), 100), // Cap at 100%
        }
      }),
    )

    // Sort by diagnosis count (descending)
    hospitalMetrics.sort((a, b) => (b.diagnosisCount || 0) - (a.diagnosisCount || 0))

    return {
      hospitalMetrics,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching hospital performance metrics:", error)
    return {
      hospitalMetrics: [],
      error: "Failed to fetch hospital performance metrics",
    }
  }
}

/**
 * Get user activity metrics
 */
export async function getUserActivityMetrics(limit = 10) {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all users with their hospital info
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id, 
        full_name, 
        email, 
        last_login,
        hospitals (id, name, code)
      `)
      .order("last_login", { ascending: false })
      .limit(limit)

    if (usersError) throw usersError

    // For each user, get their diagnosis count
    const userMetrics = await Promise.all(
      users.map(async (user) => {
        // Get total diagnoses created by this user
        const { count: diagnosisCount, error: diagnosisError } = await supabase
          .from("diagnoses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (diagnosisError) throw diagnosisError

        // Get recent diagnoses (last 30 days) for this user
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: recentDiagnoses, error: recentError } = await supabase
          .from("diagnoses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", thirtyDaysAgo.toISOString())

        if (recentError) throw recentError

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          hospitalName: Array.isArray(user.hospitals) && user.hospitals.length > 0 ? user.hospitals[0].name : "Unknown",
          lastLogin: user.last_login,
          diagnosisCount,
          recentDiagnoses,
        }
      }),
    )

    // Sort by diagnosis count (descending)
    userMetrics.sort((a, b) => (b.diagnosisCount || 0) - (a.diagnosisCount || 0))

    return {
      userMetrics,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching user activity metrics:", error)
    return {
      userMetrics: [],
      error: "Failed to fetch user activity metrics",
    }
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageUsageStats() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all diagnoses with image links
    const { data: diagnosesWithImages, error } = await supabase
      .from("diagnoses")
      .select("image_links, hospital_id, hospitals(name)")
      .not("image_links", "is", null)

    if (error) throw error

    // Calculate total images
    let totalImages = 0
    const hospitalImageCounts: Record<string, { count: number; name: string }> = {}

    diagnosesWithImages.forEach((diagnosis) => {
      if (diagnosis.image_links) {
        const imageCount = diagnosis.image_links.length
        totalImages += imageCount

        // Track by hospital
        const hospitalId = diagnosis.hospital_id
        if (!hospitalImageCounts[hospitalId]) {
          hospitalImageCounts[hospitalId] = {
            count: 0,
            name: Array.isArray(diagnosis.hospitals) && diagnosis.hospitals.length > 0 
              ? diagnosis.hospitals[0].name 
              : "Unknown",
          }
        }
        hospitalImageCounts[hospitalId].count += imageCount
      }
    })

    // Convert hospital counts to array and sort
    const hospitalStats = Object.entries(hospitalImageCounts)
      .map(([id, data]) => ({
        id,
        name: data.name,
        imageCount: data.count,
        percentage: Math.round((data.count / totalImages) * 100) || 0,
      }))
      .sort((a, b) => b.imageCount - a.imageCount)

    // Estimate storage size (assuming average image size of 2MB)
    const estimatedStorageMB = totalImages * 2
    const estimatedStorageGB = (estimatedStorageMB / 1024).toFixed(2)

    return {
      totalImages,
      estimatedStorageMB,
      estimatedStorageGB,
      hospitalStats,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching storage usage stats:", error)
    return {
      totalImages: 0,
      estimatedStorageMB: 0,
      estimatedStorageGB: "0",
      hospitalStats: [],
      error: "Failed to fetch storage usage statistics",
    }
  }
}

/**
 * Get AI analysis statistics
 */
export async function getAIAnalysisStats() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all diagnoses
    const { data: diagnoses, error } = await supabase.from("diagnoses").select("ai_analysis_results")

    if (error) throw error

    // Count diagnoses with AI analysis
    const diagnosesWithAI = diagnoses.filter(
      (d) => d.ai_analysis_results && Object.keys(d.ai_analysis_results).length > 0,
    )

    const totalDiagnoses = diagnoses.length
    const totalWithAI = diagnosesWithAI.length
    const percentageWithAI = totalDiagnoses > 0 ? Math.round((totalWithAI / totalDiagnoses) * 100) : 0

    // Extract common conditions from AI analyses
    const conditionCounts: Record<string, number> = {}

    diagnosesWithAI.forEach((diagnosis) => {
      const results = diagnosis.ai_analysis_results

      // Check for potential conditions in the AI results
      const conditions = results.potential_conditions || results.potentialConditions || []

      conditions.forEach((condition: any) => {
        const conditionName = condition.name || "Unknown"
        conditionCounts[conditionName] = (conditionCounts[conditionName] || 0) + 1
      })
    })

    // Convert to array and sort by count
    const topConditions = Object.entries(conditionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 conditions

    // Calculate average confidence score
    let totalConfidence = 0
    let confidenceCount = 0

    diagnosesWithAI.forEach((diagnosis) => {
      const results = diagnosis.ai_analysis_results
      const confidenceScore = results.confidence_score || 0

      if (confidenceScore > 0) {
        totalConfidence += confidenceScore
        confidenceCount++
      }
    })

    const averageConfidence = confidenceCount > 0 ? Math.round((totalConfidence / confidenceCount) * 100) : 0

    return {
      totalDiagnoses,
      diagnosesWithAI: totalWithAI,
      percentageWithAI,
      averageConfidence,
      topConditions,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching AI analysis stats:", error)
    return {
      totalDiagnoses: 0,
      diagnosesWithAI: 0,
      percentageWithAI: 0,
      averageConfidence: 0,
      topConditions: [],
      error: "Failed to fetch AI analysis statistics",
    }
  }
}

/**
 * Get support ticket statistics
 */
export async function getSupportTicketStats() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all support tickets
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select(`
        id,
        status,
        priority,
        created_at,
        updated_at,
        user_id,
        users (
          id,
          full_name,
          hospital_id,
          hospitals (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Count tickets by status
    const statusCounts: Record<string, number> = {
      open: 0,
      "in-progress": 0,
      resolved: 0,
      closed: 0,
    }

    tickets.forEach((ticket) => {
      const status = ticket.status.toLowerCase()
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Count tickets by priority
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
    }

    tickets.forEach((ticket) => {
      const priority = ticket.priority.toLowerCase()
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    })

    // Count tickets by hospital
    const hospitalCounts: Record<string, { count: number; name: string }> = {}

    tickets.forEach((ticket) => {
      if (Array.isArray(ticket.users)) {
        ticket.users.forEach((user) => {
          if (user.hospitals?.length) {
            user.hospitals.forEach((hospital) => {
              const hospitalId = hospital.id;
              const hospitalName = hospital.name;

              if (!hospitalCounts[hospitalId]) {
                hospitalCounts[hospitalId] = { count: 0, name: hospitalName };
              }

              hospitalCounts[hospitalId].count++;
            });
          }
        });
      }
    });    

    // Convert hospital counts to array and sort
    const hospitalStats = Object.entries(hospitalCounts)
      .map(([id, data]) => ({
        id,
        name: data.name,
        ticketCount: data.count,
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount)

    // Calculate average resolution time (for resolved/closed tickets)
    let totalResolutionTime = 0
    let resolvedCount = 0

    tickets.forEach((ticket) => {
      const status = ticket.status.toLowerCase()
      if (status === "resolved" || status === "closed") {
        const createdAt = new Date(ticket.created_at)
        const updatedAt = new Date(ticket.updated_at)
        const resolutionTime = updatedAt.getTime() - createdAt.getTime()

        // Convert to hours
        const resolutionHours = resolutionTime / (1000 * 60 * 60)

        totalResolutionTime += resolutionHours
        resolvedCount++
      }
    })

    const averageResolutionHours = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0

    return {
      totalTickets: tickets.length,
      statusCounts,
      priorityCounts,
      hospitalStats,
      averageResolutionHours,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching support ticket stats:", error)
    return {
      totalTickets: 0,
      statusCounts: { open: 0, "in-progress": 0, resolved: 0, closed: 0 },
      priorityCounts: { low: 0, medium: 0, high: 0 },
      hospitalStats: [],
      averageResolutionHours: 0,
      error: "Failed to fetch support ticket statistics",
    }
  }
}

/**
 * Update a user's admin status
 */
export async function updateUserAdminStatus(userId: string, isAdmin: boolean) {
  try {
    const supabase = createBrowserSupabaseClient()

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

    if (error) throw error

    revalidatePath("/admin/users")
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error updating admin status for user with ID ${userId}:`, error)
    return { user: null, error: "Failed to update user admin status" }
  }
}

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        hospitals (id, name, code)
      `)
      .eq("is_admin", true)
      .order("full_name")

    if (error) throw error

    return { adminUsers: data, error: null }
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return { adminUsers: [], error: "Failed to fetch admin users" }
  }
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string) {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.from("users").select("is_admin").eq("id", userId).single()

    if (error) throw error

    return { isAdmin: data?.is_admin || false, error: null }
  } catch (error) {
    console.error(`Error checking admin status for user with ID ${userId}:`, error)
    return { isAdmin: false, error: "Failed to check admin status" }
  }
}
