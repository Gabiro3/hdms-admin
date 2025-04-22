import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import AdminHospitalsList from "@/components/admin/hospitals-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Admin Hospitals | Hospital Diagnosis Management System",
  description: "Manage all hospitals in the Hospital Diagnosis Management System",
}

export default async function AdminHospitalsPage() {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Hospital Management</h1>
            <p className="text-sm text-gray-500">Manage and view all hospitals in the system</p>
          </div>
          <Link href="/admin/hospitals/create">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Hospital
            </Button>
          </Link>
        </div>

        <AdminHospitalsList />
      </div>
    </AdminLayout>
  )
}
