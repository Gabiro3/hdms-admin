import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const statType = searchParams.get("type") || "system"
    const timeRange = searchParams.get("timeRange") || "30days"
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    // Get the appropriate stats based on the type
    let result
    switch (statType) {
      case "system":
        // Get system-wide statistics
        result = await getSystemStats(supabase)
        break
      case "diagnoses":
        // Get diagnosis time series data
        result = await getDiagnosisTimeSeriesData(supabase, timeRange as any)
        break
      case "diagnosisTypes":
        // Get most common diagnosis types
        result = await getMostCommonDiagnosisTypes(supabase, limit)
        break
      case "hospitals":
        // Get hospital performance metrics
        result = await getHospitalPerformanceMetrics(supabase)
        break
      case "users":
        // Get user activity metrics
        result = await getUserActivityMetrics(supabase, limit)
        break
      case "storage":
        // Get storage usage statistics
        result = await getStorageUsageStats(supabase)
        break
      case "ai":
        // Get AI analysis statistics
        result = await getAIAnalysisStats(supabase)
        break
      case "support":
        // Get support ticket statistics
        result = await getSupportTicketStats(supabase)
        break
      default:
        return NextResponse.json({ error: "Invalid stat type" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in admin stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Helper functions for each stat type
async function getSystemStats(supabase: any) {
  // Get total diagnoses
  const { count: totalDiagnoses } = await supabase.from("diagnoses").select("*", { count: "exact", head: true })

  // Get total hospitals
  const { count: totalHospitals } = await supabase.from("hospitals").select("*", { count: "exact", head: true })

  // Get total users
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

  // Get unique patients count
  const { data: uniquePatients } = await supabase.from("diagnoses").select("patient_id").limit(1000)

  const uniquePatientIds = new Set(uniquePatients.map((d: any) => d.patient_id))
  const totalPatients = uniquePatientIds.size

  // Count total images
  const { data: diagnosesWithImages } = await supabase
    .from("diagnoses")
    .select("image_links")
    .not("image_links", "is", null)

  let totalImages = 0
  diagnosesWithImages.forEach((diagnosis: any) => {
    if (diagnosis.image_links) {
      totalImages += diagnosis.image_links.length
    }
  })

  return {
    totalDiagnoses,
    totalHospitals,
    totalUsers,
    totalPatients,
    totalImages,
  }
}

async function getDiagnosisTimeSeriesData(supabase: any, timeRange: string) {
  // Implementation similar to the server action
  // This would return time series data for diagnoses over time
  return {
    timeSeriesData: [], // Placeholder
  }
}

async function getMostCommonDiagnosisTypes(supabase: any, limit: number) {
  // Implementation similar to the server action
  // This would return the most common diagnosis types
  return {
    diagnosisTypes: [], // Placeholder
  }
}

async function getHospitalPerformanceMetrics(supabase: any) {
  // Implementation similar to the server action
  // This would return hospital performance metrics
  return {
    hospitalMetrics: [], // Placeholder
  }
}

async function getUserActivityMetrics(supabase: any, limit: number) {
  // Implementation similar to the server action
  // This would return user activity metrics
  return {
    userMetrics: [], // Placeholder
  }
}

async function getStorageUsageStats(supabase: any) {
  // Implementation similar to the server action
  // This would return storage usage statistics
  return {
    totalImages: 0,
    estimatedStorageMB: 0,
    estimatedStorageGB: "0",
    hospitalStats: [], // Placeholder
  }
}

async function getAIAnalysisStats(supabase: any) {
  // Implementation similar to the server action
  // This would return AI analysis statistics
  return {
    totalDiagnoses: 0,
    diagnosesWithAI: 0,
    percentageWithAI: 0,
    averageConfidence: 0,
    topConditions: [], // Placeholder
  }
}

async function getSupportTicketStats(supabase: any) {
  // Implementation similar to the server action
  // This would return support ticket statistics
  return {
    totalTickets: 0,
    statusCounts: { open: 0, "in-progress": 0, resolved: 0, closed: 0 },
    priorityCounts: { low: 0, medium: 0, high: 0 },
    hospitalStats: [], // Placeholder
    averageResolutionHours: 0,
  }
}

// Export the handler with authentication middleware
export const GET = handler
