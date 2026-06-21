import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { HARDCODED_USER_ID } from '@/lib/constants'
import type { UserSettings } from '@/lib/database.types'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', HARDCODED_USER_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json((data as UserSettings | null) ?? null)
}

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { email } = await req.json() as { email: string }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: HARDCODED_USER_ID, email }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data as UserSettings)
}
