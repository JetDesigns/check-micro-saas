import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service-role client. Bypasses RLS. Use only from trusted server code:
// Stripe webhooks, background jobs, admin operations. Never import from a
// Client Component — `server-only` will throw at build time if you do.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
