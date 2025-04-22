import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import AdminUsersList from "@/components/admin/users-list"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Admin Users | Hospital Diagnosis Management System",
  description: "Manage all users in the Hospital Diagnosis Management System",
}

export default async function AdminUsersPage() {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage and view all users across all hospitals</p>
          </div>
          <Link href="/admin/users/create">
            <Button className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" /> Create User
            </Button>
          </Link>
        </div>

        <AdminUsersList />
      </div>
    </AdminLayout>
  )
}
