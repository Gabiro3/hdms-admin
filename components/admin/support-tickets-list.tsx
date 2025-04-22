"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { format } from "date-fns"
import { Search, Filter, Eye, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface SupportTicketsListProps {
  status?: string
}

export default function SupportTicketsList({ status }: SupportTicketsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [searchTerm, setSearchTerm] = useState("")
  const [hospitalFilter, setHospitalFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<any[]>([])

  // Load hospitals for filtering
  useEffect(() => {
    async function loadHospitals() {
      const { data } = await supabase.from("hospitals").select("id, name").order("name")
      if (data) {
        setHospitals(data)
      }
    }

    loadHospitals()
  }, [supabase])

  // Load tickets
  useEffect(() => {
    async function loadTickets() {
      setLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        queryParams.append("page", page.toString())
        queryParams.append("limit", limit.toString())

        if (searchTerm) {
          queryParams.append("search", searchTerm)
        }

        if (status) {
          queryParams.append("status", status)
        }

        if (hospitalFilter) {
          queryParams.append("hospitalId", hospitalFilter)
        }

        if (priorityFilter) {
          queryParams.append("priority", priorityFilter)
        }

        const response = await fetch(`/api/admin/support?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch support tickets")
        }

        const data = await response.json()
        setTickets(data.tickets || [])
        setTotal(data.total || 0)
      } catch (err) {
        console.error("Error loading support tickets:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [page, limit, searchTerm, status, hospitalFilter, priorityFilter, supabase])

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
  }

  const handleHospitalChange = (value: string) => {
    setHospitalFilter(value === "all" ? null : value)
    setPage(1)
  }

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value === "all" ? null : value)
    setPage(1)
  }

  const getStatusBadge = (ticketStatus: string) => {
    switch (ticketStatus.toLowerCase()) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            <Clock className="mr-1 h-3 w-3" /> Open
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
            <Loader2 className="mr-1 h-3 w-3" /> In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            <CheckCircle className="mr-1 h-3 w-3" /> Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Closed
          </Badge>
        )
      default:
        return <Badge variant="outline">{ticketStatus}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            <AlertCircle className="mr-1 h-3 w-3" /> High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            Low
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>
          {status ? `Viewing ${status} tickets` : "View and manage all support tickets"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tickets..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={hospitalFilter || "all"} onValueChange={handleHospitalChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={priorityFilter || "all"} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || hospitalFilter || priorityFilter || status
                ? "Try adjusting your search or filter criteria."
                : "There are no support tickets in the system."}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs">{ticket.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell>{ticket.users?.full_name || "Unknown"}</TableCell>
                      <TableCell>{ticket.users?.hospitals?.name || "Unknown"}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{format(new Date(ticket.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Link href={`/admin/support/${ticket.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View ticket</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page - 1)}>Previous</PaginationLink>
                      </PaginationItem>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around the current page
                      let pageNum = page - 2 + i

                      // Adjust if we're at the beginning
                      if (page < 3) {
                        pageNum = i + 1
                      }

                      // Adjust if we're at the end
                      if (page > totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      }

                      // Ensure page number is valid
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink isActive={pageNum === page} onClick={() => setPage(pageNum)}>
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page + 1)}>Next</PaginationLink>
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
