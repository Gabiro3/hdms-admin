import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    const { diagnosisId, notes, imageUrls } = body

    if (!diagnosisId || !notes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real application, you would call an AI service here
    // For this example, we'll simulate an AI analysis
    const aiAnalysisResults = {
      summary: "AI-generated summary of the diagnosis",
      recommendations: [
        "Recommendation 1 based on the provided notes and images",
        "Recommendation 2 based on the provided notes and images",
        "Recommendation 3 based on the provided notes and images",
      ],
      potentialConditions: [
        { name: "Condition 1", probability: 0.85 },
        { name: "Condition 2", probability: 0.65 },
        { name: "Condition 3", probability: 0.45 },
      ],
      analysisTimestamp: new Date().toISOString(),
    }

    // Update the diagnosis with the AI analysis results
    const { data, error } = await supabase
      .from("diagnoses")
      .update({
        ai_analysis_results: aiAnalysisResults,
        updated_at: new Date().toISOString(),
      })
      .eq("id", diagnosisId)
      .select()
      .single()

    if (error) {
      console.error("Error updating diagnosis with AI analysis:", error)
      return NextResponse.json({ error: "Failed to update diagnosis with AI analysis" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis: aiAnalysisResults,
      diagnosis: data,
    })
  } catch (error) {
    console.error("Error in AI analysis:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
