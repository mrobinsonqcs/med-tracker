import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

    const { data, error } = await supabase
      .from('daily_doses')
      .select('*')
      .eq('date', date)

    if (error) {
      console.error('[GET /api/daily-doses] Supabase error:', error.code, error.message, error.details)
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/daily-doses] Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('daily_doses')
      .upsert(body, { onConflict: 'medication_id,date,time_of_day' })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/daily-doses] Supabase error:', error.code, error.message, error.details)
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[POST /api/daily-doses] Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
