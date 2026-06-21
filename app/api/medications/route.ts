import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

async function getUser(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET() {
  try {
    const supabase = createServerClient()
    const user = await getUser(supabase)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[GET /api/medications] Supabase error:', error.code, error.message, error.details)
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/medications] Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const user = await getUser(supabase)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { data, error } = await supabase
      .from('medications')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/medications] Supabase error:', error.code, error.message, error.details)
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/medications] Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
