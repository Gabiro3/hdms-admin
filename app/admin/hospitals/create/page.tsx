import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import HospitalForm from "@/components/admin/hospital-form"

export const metadata: Metadata = {
  title: "Create Hospital | Hospital Diagnosis Management System",
  description: "Create a new hospital in the Hospital Diagnosis Management System",
}

export default async function CreateHospitalPage() {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create New Hospital</h1>
          <p className="text-sm text-gray-500">Add a new hospital to the system</p>
        </div>

        <HospitalForm />
      </div>
    </AdminLayout>
  )
}
