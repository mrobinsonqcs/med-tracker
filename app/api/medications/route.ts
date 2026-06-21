import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { HARDCODED_USER_ID } from '@/lib/constants'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', HARDCODED_USER_ID)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServerClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('medications')
    .insert({ ...body, user_id: HARDCODED_USER_ID })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
