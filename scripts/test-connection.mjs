import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

console.log('1. Testing anonymous sign-in with anon key...')
const anon = createClient(url, anonKey)
const { data: signInData, error: signInError } = await anon.auth.signInAnonymously()

if (signInError) {
  console.log('   FAILED:', signInError.message)
  process.exit(1)
}
console.log('   OK — anonymous user created, id:', signInData.user.id)

console.log('2. Checking trigger synced row into public.users (via service role)...')
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const { data: userRow, error: userError } = await admin
  .from('users')
  .select('*')
  .eq('id', signInData.user.id)
  .single()

if (userError) {
  console.log('   FAILED:', userError.message)
  process.exit(1)
}
console.log('   OK — row found in public.users:', JSON.stringify(userRow))

console.log('3. Testing RLS: inserting a case_study as this anon user...')
const { data: csData, error: csError } = await anon
  .from('case_studies')
  .insert({ user_id: signInData.user.id })
  .select()
  .single()

if (csError) {
  console.log('   FAILED:', csError.message)
  process.exit(1)
}
console.log('   OK — case_study created:', csData.id, 'status:', csData.status)

console.log('4. Cleaning up test data...')
await admin.from('case_studies').delete().eq('id', csData.id)
await admin.auth.admin.deleteUser(signInData.user.id)
console.log('   OK — cleaned up')

console.log('\n✅ ALL CHECKS PASSED — Supabase is fully wired up.')
