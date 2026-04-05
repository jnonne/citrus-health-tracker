import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.moisture_reading !== undefined) updates.moisture_reading = body.moisture_reading === '' ? null : Number(body.moisture_reading)
  if (body.ph_reading !== undefined) updates.ph_reading = body.ph_reading === '' ? null : Number(body.ph_reading)
  if (body.last_watered !== undefined) updates.last_watered = body.last_watered

  const { data, error } = await supabase
    .from('analyses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
