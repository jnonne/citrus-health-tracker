import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: async () => (await cookies()).getAll(), setAll: () => {} } }
  )
}

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/allowed_users?email=eq.${encodeURIComponent(user.email)}&select=is_admin&limit=1`,
    { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` } }
  )
  const data = await res.json()
  return Array.isArray(data) && data[0]?.is_admin === true
}

// GET — list all users
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await getAdminClient()
  const { data, error } = await supabase.from('allowed_users').select('*').order('added_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — add user
export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { email, display_name, is_admin } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  const supabase = await getAdminClient()
  const { data, error } = await supabase
    .from('allowed_users')
    .insert({ email: email.toLowerCase().trim(), display_name, is_admin: is_admin ?? false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — update user
export async function PATCH(request: NextRequest) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { email, display_name, is_admin } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  const supabase = await getAdminClient()
  const { data, error } = await supabase
    .from('allowed_users')
    .update({ display_name, is_admin })
    .eq('email', email)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove user
export async function DELETE(request: NextRequest) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  const supabase = await getAdminClient()
  const { error } = await supabase.from('allowed_users').delete().eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
