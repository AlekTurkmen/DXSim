import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for API routes
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!

if (!process.env.SUPABASE_PROJECT_ID || !process.env.SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Client-side Supabase client for use in components
export const createClientComponentClient = () => {
  // Use the NEXT_PUBLIC_ prefixed variables for client-side
  const url = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  
  return createClient(url, key)
}

// Helper to get client-side supabase instance
export const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return createClientComponentClient()
  } else {
    // Server-side
    return supabase
  }
}
