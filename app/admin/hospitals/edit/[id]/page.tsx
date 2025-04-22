import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import HospitalForm from "@/components/admin/hospital-form"
import { getHospitalById } from "@/services/hospital-service"

export const metadata: Metadata = {
  title: "Edit Hospital | Hospital Diagnosis Management System",
  description: "Edit hospital details in the Hospital Diagnosis Management System",
}

export default async function EditHospitalPage({ params }: { params: { id: string } }) {
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
    redirect("/dashboard")
  }

  // Get hospital data
  const { hospital, error } = await getHospitalById(params.id)

  if (error || !hospital) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Edit Hospital</h1>
          <p className="text-sm text-gray-500">Update hospital information</p>
        </div>

        <HospitalForm hospital={hospital} />
      </div>
    </AdminLayout>
  )
}
