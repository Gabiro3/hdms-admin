import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    // Upload the file
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)

    if (error) {
      throw error
    }

    // Get the public URL
    const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(path)

    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { url: null, error: "Failed to upload file" }
  }
}
