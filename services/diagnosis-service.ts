"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"

type Diagnosis = Database["public"]["Tables"]["diagnoses"]["Row"]
type DiagnosisInsert = Database["public"]["Tables"]["diagnoses"]["Insert"]
type DiagnosisUpdate = Database["public"]["Tables"]["diagnoses"]["Update"]

export async function getDiagnoses(hospitalId?: string, userId?: string) {
  try {
    const supabase = createServerSupabaseClient()
    let query = supabase.from("diagnoses").select(`
        *,
        users (id, full_name, email),
        hospitals (id, name, code)
      `)

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return { diagnoses: data, error: null }
  } catch (error) {
    console.error("Error fetching diagnoses:", error)
    return { diagnoses: null, error: "Failed to fetch diagnoses" }
  }
}

export async function getDiagnosisById(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("diagnoses")
      .select(`
        *,
        users (id, full_name, email),
        hospitals (id, name, code)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return { diagnosis: data, error: null }
  } catch (error) {
    console.error(`Error fetching diagnosis with ID ${id}:`, error)
    return { diagnosis: null, error: "Failed to fetch diagnosis" }
  }
}

export async function createDiagnosis(diagnosis: DiagnosisInsert) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("diagnoses").insert(diagnosis).select().single()

    if (error) throw error

    revalidatePath("/diagnoses")
    return { diagnosis: data, error: null }
  } catch (error) {
    console.error("Error creating diagnosis:", error)
    return { diagnosis: null, error: "Failed to create diagnosis" }
  }
}

export async function updateDiagnosis(id: string, diagnosis: DiagnosisUpdate) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("diagnoses")
      .update({ ...diagnosis, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/diagnoses/${id}`)
    revalidatePath("/diagnoses")
    return { diagnosis: data, error: null }
  } catch (error) {
    console.error(`Error updating diagnosis with ID ${id}:`, error)
    return { diagnosis: null, error: "Failed to update diagnosis" }
  }
}

export async function deleteDiagnosis(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("diagnoses").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/diagnoses")
    return { error: null }
  } catch (error) {
    console.error(`Error deleting diagnosis with ID ${id}:`, error)
    return { error: "Failed to delete diagnosis" }
  }
}

export async function uploadDiagnosisImage(file: File, diagnosisId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Upload the file to storage
    const fileName = `${diagnosisId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("diagnosis-images")
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = await supabase.storage.from("diagnosis-images").getPublicUrl(fileName)

    // Update the diagnosis with the new image link
    const { data: diagnosis } = await supabase.from("diagnoses").select("image_links").eq("id", diagnosisId).single()

    const imageLinks = diagnosis.image_links || []
    imageLinks.push(urlData.publicUrl)

    const { data, error } = await supabase
      .from("diagnoses")
      .update({
        image_links: imageLinks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", diagnosisId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/diagnoses/${diagnosisId}`)
    return { imageUrl: urlData.publicUrl, error: null }
  } catch (error) {
    console.error(`Error uploading image for diagnosis ${diagnosisId}:`, error)
    return { imageUrl: null, error: "Failed to upload image" }
  }
}

export async function removeDiagnosisImage(diagnosisId: string, imageUrl: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current image links
    const { data: diagnosis } = await supabase.from("diagnoses").select("image_links").eq("id", diagnosisId).single()

    if (!diagnosis.image_links) {
      return { error: "No images found" }
    }

    // Remove the image URL from the array
    const updatedImageLinks = diagnosis.image_links.filter((url) => url !== imageUrl)

    // Update the diagnosis
    const { data, error } = await supabase
      .from("diagnoses")
      .update({
        image_links: updatedImageLinks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", diagnosisId)
      .select()
      .single()

    if (error) throw error

    // Extract the file path from the URL to delete from storage
    const urlParts = imageUrl.split("/")
    const filePath = urlParts.slice(urlParts.indexOf("diagnosis-images") + 1).join("/")

    // Delete the file from storage
    const { error: deleteError } = await supabase.storage.from("diagnosis-images").remove([filePath])

    if (deleteError) {
      console.error(`Error deleting image file: ${deleteError.message}`)
    }

    revalidatePath(`/diagnoses/${diagnosisId}`)
    return { error: null }
  } catch (error) {
    console.error(`Error removing image for diagnosis ${diagnosisId}:`, error)
    return { error: "Failed to remove image" }
  }
}
