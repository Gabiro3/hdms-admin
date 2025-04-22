"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"

type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"]
type SupportTicketInsert = Database["public"]["Tables"]["support_tickets"]["Insert"]
type SupportTicketUpdate = Database["public"]["Tables"]["support_tickets"]["Update"]

/**
 * Get support tickets with pagination and filtering
 */
export async function getSupportTickets({
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  userId = null,
  hospitalId = null,
  status = null,
  priority = null,
  searchTerm = null,
}: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  userId?: string | null
  hospitalId?: string | null
  status?: string | null
  priority?: string | null
  searchTerm?: string | null
}) {
  try {
    const supabase = createServerSupabaseClient()
    const offset = (page - 1) * limit

    // Start building the query
    let query = supabase.from("support_tickets").select(
      `
      *,
      users (
        id, 
        full_name, 
        email,
        hospital_id,
        hospitals (
          id,
          name,
          code
        )
      )
    `,
      { count: "exact" },
    )

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (searchTerm) {
      query = query.or(`subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
    }

    // Filter by hospital ID (through the users table)
    if (hospitalId) {
      // First get all users from this hospital
      const { data: hospitalUsers } = await supabase.from("users").select("id").eq("hospital_id", hospitalId)

      if (hospitalUsers && hospitalUsers.length > 0) {
        const userIds = hospitalUsers.map((user) => user.id)
        query = query.in("user_id", userIds)
      } else {
        // No users in this hospital, return empty result
        return {
          tickets: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          error: null,
        }
      }
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      tickets: data,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return {
      tickets: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: "Failed to fetch support tickets",
    }
  }
}

/**
 * Get a support ticket by ID
 */
export async function getSupportTicketById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        users (
          id, 
          full_name, 
          email,
          hospital_id,
          hospitals (
            id,
            name,
            code
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { ticket: data, error: null }
  } catch (error) {
    console.error(`Error fetching support ticket with ID ${id}:`, error)
    return { ticket: null, error: "Failed to fetch support ticket" }
  }
}

/**
 * Create a support ticket on behalf of a user (admin function)
 */
export async function createSupportTicketForUser(ticket: SupportTicketInsert) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate required fields
    if (!ticket.subject || !ticket.message || !ticket.user_id) {
      return { ticket: null, error: "Subject, message, and user ID are required" }
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        ...ticket,
        status: ticket.status || "open",
        priority: ticket.priority || "medium",
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/support")
    return { ticket: data, error: null }
  } catch (error) {
    console.error("Error creating support ticket:", error)
    return { ticket: null, error: "Failed to create support ticket" }
  }
}

/**
 * Update a support ticket status
 */
export async function updateSupportTicketStatus(id: string, status: string, adminNotes?: string) {
  try {
    const supabase = createServerSupabaseClient()

    const updateData: SupportTicketUpdate = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add admin notes if provided
    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    const { data, error } = await supabase.from("support_tickets").update(updateData).eq("id", id).select().single()

    if (error) throw error

    revalidatePath(`/admin/support/${id}`)
    revalidatePath("/admin/support")
    return { ticket: data, error: null }
  } catch (error) {
    console.error(`Error updating support ticket status with ID ${id}:`, error)
    return { ticket: null, error: "Failed to update support ticket status" }
  }
}

/**
 * Get support tickets for a specific user
 */
export async function getUserSupportTickets(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { tickets: data, error: null }
  } catch (error) {
    console.error(`Error fetching support tickets for user with ID ${userId}:`, error)
    return { tickets: [], error: "Failed to fetch user support tickets" }
  }
}

/**
 * Add a response to a support ticket
 */
export async function addSupportTicketResponse(ticketId: string, response: string, isAdminResponse = true) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("responses")
      .eq("id", ticketId)
      .single()

    if (ticketError) throw ticketError

    // Prepare the new response
    const newResponse = {
      id: crypto.randomUUID(),
      content: response,
      is_admin_response: isAdminResponse,
      created_at: new Date().toISOString(),
    }

    // Update the responses array
    const responses = ticket.responses || []
    responses.push(newResponse)

    // Update the ticket
    const { data, error } = await supabase
      .from("support_tickets")
      .update({
        responses,
        updated_at: new Date().toISOString(),
        // If it's an admin response and the ticket is open, set it to in-progress
        ...(isAdminResponse && ticket.status === "open" ? { status: "in-progress" } : {}),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/admin/support/${ticketId}`)
    revalidatePath("/admin/support")
    return { ticket: data, error: null }
  } catch (error) {
    console.error(`Error adding response to support ticket with ID ${ticketId}:`, error)
    return { ticket: null, error: "Failed to add response to support ticket" }
  }
}

/**
 * Get support ticket statistics by user
 */
export async function getUserSupportTicketStats(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all tickets for this user
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("status, priority, created_at, updated_at")
      .eq("user_id", userId)

    if (error) throw error

    // Count tickets by status
    const statusCounts: Record<string, number> = {
      open: 0,
      "in-progress": 0,
      resolved: 0,
      closed: 0,
    }

    tickets.forEach((ticket) => {
      const status = ticket.status.toLowerCase()
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Count tickets by priority
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
    }

    tickets.forEach((ticket) => {
      const priority = ticket.priority.toLowerCase()
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    })

    // Calculate average resolution time (for resolved/closed tickets)
    let totalResolutionTime = 0
    let resolvedCount = 0

    tickets.forEach((ticket) => {
      const status = ticket.status.toLowerCase()
      if (status === "resolved" || status === "closed") {
        const createdAt = new Date(ticket.created_at)
        const updatedAt = new Date(ticket.updated_at)
        const resolutionTime = updatedAt.getTime() - createdAt.getTime()

        // Convert to hours
        const resolutionHours = resolutionTime / (1000 * 60 * 60)

        totalResolutionTime += resolutionHours
        resolvedCount++
      }
    })

    const averageResolutionHours = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0

    return {
      totalTickets: tickets.length,
      statusCounts,
      priorityCounts,
      averageResolutionHours,
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching support ticket stats for user with ID ${userId}:`, error)
    return {
      totalTickets: 0,
      statusCounts: { open: 0, "in-progress": 0, resolved: 0, closed: 0 },
      priorityCounts: { low: 0, medium: 0, high: 0 },
      averageResolutionHours: 0,
      error: "Failed to fetch support ticket statistics",
    }
  }
}
