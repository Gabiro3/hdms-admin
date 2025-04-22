"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"

type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"]
type SupportTicketInsert = Database["public"]["Tables"]["support_tickets"]["Insert"]
type SupportTicketUpdate = Database["public"]["Tables"]["support_tickets"]["Update"]

export async function getSupportTickets(userId?: string) {
  try {
    const supabase = createServerSupabaseClient()
    let query = supabase.from("support_tickets").select(`
        *,
        users (id, full_name, email)
      `)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return { tickets: data, error: null }
  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return { tickets: null, error: "Failed to fetch support tickets" }
  }
}

export async function getSupportTicketById(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        users (id, full_name, email)
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

export async function createSupportTicket(ticket: SupportTicketInsert) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("support_tickets").insert(ticket).select().single()

    if (error) throw error

    revalidatePath("/support")
    return { ticket: data, error: null }
  } catch (error) {
    console.error("Error creating support ticket:", error)
    return { ticket: null, error: "Failed to create support ticket" }
  }
}

export async function updateSupportTicketStatus(id: string, status: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("support_tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/support/${id}`)
    revalidatePath("/support")
    return { ticket: data, error: null }
  } catch (error) {
    console.error(`Error updating support ticket status with ID ${id}:`, error)
    return { ticket: null, error: "Failed to update support ticket status" }
  }
}

export async function deleteSupportTicket(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("support_tickets").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/support")
    return { error: null }
  } catch (error) {
    console.error(`Error deleting support ticket with ID ${id}:`, error)
    return { error: "Failed to delete support ticket" }
  }
}
