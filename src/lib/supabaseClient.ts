import { createClient } from '@supabase/supabase-js'

// Safe fallback values that prevent build failures
// These should be overridden via Vercel environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'

// Log warnings for missing critical env vars (visible in dev console)
if (import.meta.env.DEV && (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder'))) {
  console.warn('[supabaseClient] Using placeholder values. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or Vercel env vars.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Export service role key for admin operations (use with caution)
export const supabaseServiceRoleKeyEnv = supabaseServiceRoleKey
