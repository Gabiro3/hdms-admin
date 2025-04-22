import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import DiagnosisDetail from "@/components/diagnoses/diagnosis-detail"
import AdminLayout from "@/components/layout/admin-layout"

export const metadata: Metadata = {
  title: "Diagnosis Details | Hospital Diagnosis Management System",
  description: "View diagnosis details",
}

export default async function DiagnosisDetailPage({
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

  if (!session) {
    redirect("/login")
  }

  // Get user data and check if admin
  const { data: userData } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!userData || !userData.is_admin) {
    redirect("/unauthorized")
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
    .single()

  if (!diagnosis) {
    notFound()
  }


  return (
    <AdminLayout>
      <DiagnosisDetail diagnosis={diagnosis} />
    </AdminLayout>
  )
}
