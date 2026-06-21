import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!date && (!from || !to)) {
      return NextResponse.json({ error: 'date or from+to required' }, { status: 400 })
    }

    const query = supabase.from('daily_doses').select('*')
    const { data, error } = date
      ? await query.eq('date', date)
      : await query.gte('date', from!).lte('date', to!)

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
