import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import AdminDiagnosesList from "@/components/admin/diagnoses-list"
import { getAllDiagnoses } from "@/services/admin-service"

export const metadata: Metadata = {
  title: "Admin Diagnoses | Hospital Diagnosis Management System",
  description: "Manage all diagnoses in the Hospital Diagnosis Management System",
}

export default async function AdminDiagnosesPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data and check if admin
  const { data: userData } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!userData || !userData.is_admin) {
    redirect("/unauthorized")
  }

  // Get all diagnoses (first page)
  const { diagnoses, total, page, limit, totalPages, error } = await getAllDiagnoses({
    page: 1,
    limit: 10,
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">All Diagnoses</h1>
          <p className="text-sm text-gray-500">Manage and view all diagnoses across all hospitals</p>
        </div>

        <AdminDiagnosesList
          initialDiagnoses={diagnoses || []}
          initialTotal={total || 0}
          initialPage={page || 1}
          initialLimit={limit || 10}
          initialTotalPages={totalPages || 0}
        />
      </div>
    </AdminLayout>
  )
}
