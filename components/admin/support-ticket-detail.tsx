"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ArrowLeft, Clock, AlertCircle, CheckCircle, Loader2, Send, User, Building } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SupportTicketDetailProps {
  ticket: any
}

export default function SupportTicketDetail({ ticket }: SupportTicketDetailProps) {
  const router = useRouter()
  const [status, setStatus] = useState(ticket.status)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update ticket status")
      }

      setStatus(newStatus)
      setSuccess("Ticket status updated successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error updating ticket status:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!response.trim()) {
      setError("Response cannot be empty")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiResponse = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response }),
      })

      if (!apiResponse.ok) {
        throw new Error("Failed to submit response")
      }

      const data = await apiResponse.json()

      // Update the ticket status if it changed
      if (data.ticket && data.ticket.status !== status) {
        setStatus(data.ticket.status)
      }

      setResponse("")
      setSuccess("Response submitted successfully")

      // Refresh the page to show the new response
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error submitting response:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Ticket</h1>
          <p className="text-sm text-muted-foreground">Ticket ID: {ticket.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Priority</span>
                  {getPriorityBadge(ticket.priority)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-muted-foreground">{format(new Date(ticket.created_at), "PPP p")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">{format(new Date(ticket.updated_at), "PPP p")}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">User Information</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {ticket.users?.full_name ? getInitials(ticket.users.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{ticket.users?.full_name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{ticket.users?.email || "No email"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">User ID</p>
                    <p className="text-xs font-mono text-muted-foreground">{ticket.user_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">Hospital</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.users?.hospitals?.name || "Unknown Hospital"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
              <CardDescription>
                {getStatusBadge(ticket.status)} • {getPriorityBadge(ticket.priority)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{ticket.message}</div>
            </CardContent>
          </Card>

          {/* Conversation Thread */}
          {ticket.responses && ticket.responses.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.responses.map((response: any) => (
                    <div
                      key={response.id}
                      className={`flex ${response.is_admin_response ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          response.is_admin_response ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-4">
                          <span className="text-xs font-medium">
                            {response.is_admin_response
                              ? response.admin_name || "Administrator"
                              : ticket.users?.full_name || "User"}
                          </span>
                          <span className="text-xs opacity-70">
                            {format(new Date(response.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{response.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Form */}
          <Card>
            <CardHeader>
              <CardTitle>Respond to Ticket</CardTitle>
              <CardDescription>
                Your response will be sent to the user and added to the conversation history
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitResponse}>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 bg-green-50 text-green-700">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Textarea
                  placeholder="Type your response here..."
                  className="min-h-[150px]"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Response
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
