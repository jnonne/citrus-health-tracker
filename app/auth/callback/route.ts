import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Build the redirect response — session cookies must be set directly on it
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Whitelist is enforced by proxy.ts on every request — no need to check here.
  // Handle trusted device preference
  const trustPref = request.cookies.get('trust_device_pref')?.value

  if (trustPref === '1') {
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const deviceId = crypto.randomUUID()
    const deviceName = request.headers.get('user-agent') ?? 'Unknown device'
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await serviceSupabase.from('trusted_devices').insert({
      user_id: data.user.id,
      device_id: deviceId,
      device_name: deviceName.slice(0, 200),
      expires_at: expiresAt.toISOString(),
    })

    response.cookies.set('trusted_device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
  }

  // Clear the short-lived trust preference cookie
  response.cookies.set('trust_device_pref', '', { maxAge: 0, path: '/' })

  return response
}
