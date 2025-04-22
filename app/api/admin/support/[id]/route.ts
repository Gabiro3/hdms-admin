import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/server-auth"
import { sendSupportTicketUpdateEmail } from "@/lib/utils/email-utils"

async function handler(req: NextRequest, user: any) {
  try {
    // Check if the user is an admin
    const supabase = createServerSupabaseClient()

    // Get the ticket ID from the URL
    const ticketId = req.nextUrl.pathname.split("/").pop()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Handle different HTTP methods
    if (req.method === "GET") {
      return handleGetTicket(ticketId, supabase)
    } else if (req.method === "PATCH") {
      return handleUpdateTicket(ticketId, req, supabase)
    } else if (req.method === "POST") {
      return handleAddResponse(ticketId, req, supabase, user.id)
    } else {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }
  } catch (error) {
    console.error("Error in admin support ticket API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

async function handleGetTicket(ticketId: string, supabase: any) {
  // Get the ticket with user information
  const { data: ticket, error } = await supabase
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
    .eq("id", ticketId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ ticket })
}

async function handleUpdateTicket(ticketId: string, req: NextRequest, supabase: any) {
  // Parse the request body
  const body = await req.json()

  // Get the current ticket to check user info for notifications
  const { data: currentTicket, error: ticketError } = await supabase
    .from("support_tickets")
    .select(`
      *,
      users (
        id, 
        full_name, 
        email
      )
    `)
    .eq("id", ticketId)
    .single()

  if (ticketError) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  // Only include fields that are provided
  if (body.status !== undefined) updateData.status = body.status
  if (body.priority !== undefined) updateData.priority = body.priority
  if (body.adminNotes !== undefined) updateData.admin_notes = body.adminNotes

  // Update the ticket
  const { data, error } = await supabase.from("support_tickets").update(updateData).eq("id", ticketId).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notification email if status changed
  if (body.status !== undefined && body.status !== currentTicket.status) {
    const userEmail = currentTicket.users?.email
    const userName = currentTicket.users?.full_name

    if (userEmail && userName) {
      await sendSupportTicketUpdateEmail(userEmail, userName, ticketId, currentTicket.subject, body.status)
    }
  }

  return NextResponse.json({
    success: true,
    ticket: data,
  })
}

async function handleAddResponse(ticketId: string, req: NextRequest, supabase: any, adminUserId: string) {
  // Parse the request body
  const body = await req.json()

  if (!body.response) {
    return NextResponse.json({ error: "Response content is required" }, { status: 400 })
  }

  // Get the current ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select(`
      responses,
      subject,
      users (
        id, 
        full_name, 
        email
      )
    `)
    .eq("id", ticketId)
    .single()

  if (ticketError) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  // Get admin user info
  const { data: adminUser } = await supabase.from("users").select("full_name").eq("id", adminUserId).single()

  // Prepare the new response
  const newResponse = {
    id: crypto.randomUUID(),
    content: body.response,
    is_admin_response: true,
    admin_name: adminUser?.full_name || "Administrator",
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
      // If the ticket is open, set it to in-progress
      ...(ticket.status === "open" ? { status: "in-progress" } : {}),
    })
    .eq("id", ticketId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notification email to the user
  const userEmail = ticket.users?.email
  const userName = ticket.users?.full_name

  if (userEmail && userName) {
    await sendSupportTicketUpdateEmail(userEmail, userName, ticketId, ticket.subject, data.status)
  }

  return NextResponse.json({
    success: true,
    ticket: data,
  })
}

// Export the handler with authentication middleware
export const GET = handler
export const PATCH = handler
export const POST = handler
