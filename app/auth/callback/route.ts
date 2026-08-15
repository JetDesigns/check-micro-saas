import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Magic-link callback. Supabase redirects here with ?code=... after the user
// clicks the email link. We:
//   1. Exchange the code for a session (upgrades the anon user to registered
//      without changing user_id — same session, now with a verified email).
//   2. Grant a one-time signup bonus (idempotent per user_id).
//   3. Redirect to ?next (from emailRedirectTo), tagging ?login=1 so the
//      destination can flash "1 free credit added".
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  )
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/?auth_error=exchange_failed`)
  }

  // Session is now authenticated — get the user and grant the bonus.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    try {
      const admin = createAdminClient()
      const { error: bonusError } = await admin.rpc('grant_signup_bonus', {
        p_user_id: user.id,
      })
      if (bonusError) {
        // Non-fatal — login succeeded, only the bonus failed. Log and continue.
        console.warn('[/auth/callback] grant_signup_bonus failed:', bonusError)
      }
    } catch (e) {
      console.warn('[/auth/callback] bonus grant threw:', e)
    }
  }

  // Tag the destination with ?login=1 so the destination page can show a
  // welcome flash. Preserve any existing query on `next`.
  const dest = appendLoginFlag(next)
  return NextResponse.redirect(`${origin}${dest}`)
}

function appendLoginFlag(path: string): string {
  const [pathname, existingQuery] = path.split('?')
  const params = new URLSearchParams(existingQuery ?? '')
  params.set('login', '1')
  return `${pathname}?${params.toString()}`
}
