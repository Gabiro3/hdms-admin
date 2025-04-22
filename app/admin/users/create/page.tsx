import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import CreateUserForm from "@/components/admin/create-user-form"

export const metadata: Metadata = {
  title: "Create User | Hospital Diagnosis Management System",
  description: "Create a new user in the Hospital Diagnosis Management System",
}

export default async function CreateUserPage() {
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

  // Get hospitals for the form
  const { data: hospitals } = await supabase.from("hospitals").select("id, name, code").order("name")

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create New User</h1>
          <p className="text-sm text-gray-500">Create a new user account with a temporary password</p>
        </div>

        <CreateUserForm hospitals={hospitals || []} />
      </div>
    </AdminLayout>
  )
}
