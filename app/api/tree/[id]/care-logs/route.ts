import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tree_care_logs')
    .select('*')
    .eq('tree_id', id)
    .order('care_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { care_type, care_date, notes, fertilizer_name, fertilizer_amount } = body

  if (!care_type || !care_date) {
    return NextResponse.json({ error: 'care_type and care_date are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tree_care_logs')
    .insert({
      tree_id: id,
      user_id: user.id,
      care_type,
      care_date,
      notes: notes || null,
      fertilizer_name: fertilizer_name || null,
      fertilizer_amount: fertilizer_amount || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
