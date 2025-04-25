import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import AdminBillingDashboard from "@/components/admin/admin-billing-dashboard"
import { getBillingData, getInvoices } from "@/services/billing-service"
import { format, subMonths } from "date-fns"

export const metadata: Metadata = {
  title: "Admin Billing | Hospital Diagnosis Management System",
  description: "Manage billing and invoices for all hospitals",
}

export default async function AdminBillingPage() {
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

  // Get billing data for all hospitals for the last month
  const today = new Date()
  const startDate = format(subMonths(today, 1), "yyyy-MM-dd")
  const endDate = format(today, "yyyy-MM-dd")

  const { billingData } = await getBillingData({
    startDate,
    endDate,
  })

  // Get all hospitals for filtering
  const { data: hospitals } = await supabase.from("hospitals").select("id, name, code").order("name")

  // Get all invoices
  const { invoices } = await getInvoices()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Billing Administration</h1>
          <p className="text-sm text-gray-500">Manage billing and invoices for all hospitals</p>
        </div>

        <AdminBillingDashboard
          initialBillingData={billingData}
          hospitals={hospitals || []}
          initialInvoices={invoices || []}
        />
      </div>
    </AdminLayout>
  )
}
