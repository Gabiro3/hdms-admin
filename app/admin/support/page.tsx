import type { Metadata } from "next"
import { Suspense } from "react"
import AdminLayout from "@/components/layout/admin-layout"
import SupportTicketsList from "@/components/admin/support-tickets-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Support Tickets | Admin Dashboard",
  description: "Manage user support tickets",
}

export default function AdminSupportPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Ticket Management</h1>
          <p className="text-sm text-muted-foreground">View and respond to user support tickets across all hospitals</p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Suspense fallback={<TicketsListSkeleton />}>
              <SupportTicketsList />
            </Suspense>
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            <Suspense fallback={<TicketsListSkeleton />}>
              <SupportTicketsList status="open" />
            </Suspense>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <Suspense fallback={<TicketsListSkeleton />}>
              <SupportTicketsList status="in-progress" />
            </Suspense>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            <Suspense fallback={<TicketsListSkeleton />}>
              <SupportTicketsList status="resolved" />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

function TicketsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>Loading tickets...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
