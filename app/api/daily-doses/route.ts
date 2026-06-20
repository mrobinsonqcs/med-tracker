import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const { data, error } = await supabase
    .from('daily_doses')
    .select('*')
    .eq('date', date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServerClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('daily_doses')
    .upsert(body, { onConflict: 'medication_id,date,time_of_day' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
