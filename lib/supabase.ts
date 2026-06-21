import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('[supabase] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ?? '(not set)')

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[supabase] Missing env vars — URL:', supabaseUrl ?? '(not set)', '| SERVICE_ROLE_KEY:', serviceRoleKey ? '(set)' : '(not set)')
  }
  return createClient(supabaseUrl!, serviceRoleKey!)
}
