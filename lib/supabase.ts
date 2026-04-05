import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

/**
 * Browser client — used in Client Components ('use client').
 * Handles session cookies automatically via @supabase/ssr.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Convenience singleton for client components
let _browser: ReturnType<typeof createBrowserClient> | null = null
export function getBrowserClient() {
  if (!_browser) _browser = createSupabaseBrowserClient()
  return _browser
}
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_t, prop) {
    return (getBrowserClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Server-side service-role client (API routes only — not middleware)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function getPhotoUrl(path: string): string {
  const { data } = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).storage.from('tree-photos').getPublicUrl(path)
  return data.publicUrl
}
