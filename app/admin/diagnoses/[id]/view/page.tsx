import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DiagnosisView from "@/components/diagnoses/diagnosis-view"

export const metadata: Metadata = {
  title: "View Diagnosis | Hospital Diagnosis Management System",
  description: "View diagnosis details and AI analysis results",
}

export default async function ViewDiagnosisPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase.from("users").select("hospital_id").eq("id", session.user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Get diagnosis data
  const { data: diagnosis } = await supabase
    .from("diagnoses")
    .select(`
      *,
      users (
        id,
        full_name,
        email
      ),
      hospitals (
        id,
        name,
        code
      )
    `)
    .eq("id", params.id)
    .single()

  if (!diagnosis) {
    notFound()
  }

  return (
    <DashboardLayout>
      <DiagnosisView diagnosis={diagnosis} />
    </DashboardLayout>
  )
}
