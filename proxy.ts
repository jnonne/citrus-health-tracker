import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const trustedDeviceId = request.cookies.get('trusted_device_id')?.value
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    if (trustedDeviceId) url.searchParams.set('trusted', '1')
    return NextResponse.redirect(url)
  }

  // Whitelist check via direct REST API with service role key (bypasses RLS reliably in Edge Runtime)
  const whitelistUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_users?email=eq.${encodeURIComponent(user.email ?? '')}&select=email&limit=1`

  const whitelistRes = await fetch(whitelistUrl, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  })

  const whitelistData = await whitelistRes.json()
  const isAllowed = Array.isArray(whitelistData) && whitelistData.length > 0

  if (!isAllowed) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/access-denied'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)',
  ],
}
