import type { Metadata } from "next"
import { notFound } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"
import SupportTicketDetail from "@/components/admin/support-ticket-detail"
import { getSupportTicketById } from "@/services/support-ticket-service"

export const metadata: Metadata = {
  title: "Support Ticket Details | Admin Dashboard",
  description: "View and respond to support ticket",
}

export default async function AdminSupportTicketPage({
  params,
}: {
  params: { id: string }
}) {
  const { ticket, error } = await getSupportTicketById(params.id)

  if (error || !ticket) {
    notFound()
  }

  return (
    <AdminLayout>
      <SupportTicketDetail ticket={ticket} />
    </AdminLayout>
  )
}
