import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import AdminDashboardStats from "@/components/admin/dashboard-stats"
import AdminDiagnosisChart from "@/components/admin/diagnosis-chart"
import AdminUserActivity from "@/components/admin/user-activity"
import { getSystemStats, getDiagnosisTimeSeriesData } from "@/services/admin-service"

export const metadata: Metadata = {
  title: "Admin Dashboard | Hospital Diagnosis Management System",
  description: "Administrative dashboard for the Hospital Diagnosis Management System",
}

export default async function AdminDashboardPage() {
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

  // Get system stats
  const {
    totalDiagnoses,
    totalHospitals,
    totalUsers,
    totalPatients,
    totalImages,
    error: statsError,
  } = await getSystemStats()

  // Get time series data for diagnoses
  const { timeSeriesData, error: timeSeriesError } = await getDiagnosisTimeSeriesData("30days")

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">System overview and key performance indicators</p>
        </div>

        <AdminDashboardStats
          totalDiagnoses={totalDiagnoses || 0}
          totalUsers={totalUsers || 0}
          totalImages={totalImages || 0}
          totalHospitals={totalHospitals || 0}
          totalPatients={totalPatients || 0}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <AdminDiagnosisChart timeSeriesData={timeSeriesData || []} />
          <AdminUserActivity />
        </div>
      </div>
    </AdminLayout>
  )
}
