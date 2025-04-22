import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a singleton instance for the client
let supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export const createBrowserSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

// Get the singleton instance
export const getSupabaseBrowserClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserSupabaseClient()
  }
  return supabaseClient
}

// Get the current session token - useful for API requests
export const getAuthToken = async (): Promise<string | null> => {
  const supabase = getSupabaseBrowserClient()
  const token = supabase.auth['headers']['Authorization'];
  return token || null;
}
