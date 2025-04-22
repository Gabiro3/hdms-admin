"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"

type Hospital = Database["public"]["Tables"]["hospitals"]["Row"]
type HospitalInsert = Database["public"]["Tables"]["hospitals"]["Insert"]
type HospitalUpdate = Database["public"]["Tables"]["hospitals"]["Update"]

export async function getHospitals() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("hospitals").select("*").order("name")

    if (error) throw error
    return { hospitals: data, error: null }
  } catch (error) {
    console.error("Error fetching hospitals:", error)
    return { hospitals: null, error: "Failed to fetch hospitals" }
  }
}

export async function getHospitalById(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("hospitals").select("*").eq("id", id).single()

    if (error) throw error
    return { hospital: data, error: null }
  } catch (error) {
    console.error(`Error fetching hospital with ID ${id}:`, error)
    return { hospital: null, error: "Failed to fetch hospital" }
  }
}

export async function createHospital(hospital: HospitalInsert) {
  try {
    // Generate a custom code if not provided
    if (!hospital.code) {
      hospital.code = `HSP-${Math.floor(10000 + Math.random() * 90000)}`
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("hospitals").insert(hospital).select().single()

    if (error) throw error

    revalidatePath("/hospitals")
    return { hospital: data, error: null }
  } catch (error) {
    console.error("Error creating hospital:", error)
    return { hospital: null, error: "Failed to create hospital" }
  }
}

export async function updateHospital(id: string, hospital: HospitalUpdate) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("hospitals")
      .update({ ...hospital, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/hospitals/${id}`)
    revalidatePath("/hospitals")
    return { hospital: data, error: null }
  } catch (error) {
    console.error(`Error updating hospital with ID ${id}:`, error)
    return { hospital: null, error: "Failed to update hospital" }
  }
}

export async function deleteHospital(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("hospitals").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/hospitals")
    return { error: null }
  } catch (error) {
    console.error(`Error deleting hospital with ID ${id}:`, error)
    return { error: "Failed to delete hospital" }
  }
}
