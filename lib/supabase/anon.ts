import { createClient } from './client'

// Call before any wizard DB write. If no user session exists, signs in
// anonymously so RLS policies pass. Anonymous users are upgraded to email
// users at payment via supabase.auth.updateUser({ email }) in step 5.
export async function ensureAnonymousSession() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}
