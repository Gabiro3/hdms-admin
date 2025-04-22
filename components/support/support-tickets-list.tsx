"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Loader2, Search, Filter, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SupportTicketsListProps {
  userId: string
  hospitalId: string
  refreshTrigger: boolean
}

interface SupportTicket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export default function SupportTicketsList({ userId, hospitalId, refreshTrigger }: SupportTicketsListProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true)
      try {
        // Fetch tickets for the user's hospital
        const { data, error } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setTickets(data || [])
      } catch (error) {
        console.error("Error fetching support tickets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [userId, hospitalId, refreshTrigger, supabase])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>
      case "in-progress":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>
      case "closed":
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Support Tickets</CardTitle>
          <CardDescription>View and manage your support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tickets..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't submitted any support tickets yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{format(new Date(ticket.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View ticket</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>Ticket ID: {selectedTicket?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Status:</span>
                {selectedTicket && getStatusBadge(selectedTicket.status)}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Priority:</span>
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-muted-foreground">
                  {selectedTicket && format(new Date(selectedTicket.created_at), "PPP p")}
                </span>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Message</h4>
              <div className="rounded-md bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm">{selectedTicket?.message}</p>
              </div>
            </div>

            {selectedTicket?.updated_at !== selectedTicket?.created_at && (
              <div className="text-xs text-muted-foreground">
                Last updated: {format(new Date(selectedTicket?.updated_at || ""), "PPP p")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
