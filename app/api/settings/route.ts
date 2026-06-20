import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { UserSettings } from '@/lib/database.types'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json((data as UserSettings | null) ?? null)
}

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { email } = await req.json() as { email: string }

  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .limit(1)
    .single()

  const existingRow = existing as Pick<UserSettings, 'id'> | null

  if (existingRow) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ email } as Partial<UserSettings>)
      .eq('id', existingRow.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data as UserSettings)
  }

  const { data, error } = await supabase
    .from('user_settings')
    .insert({ email } as Omit<UserSettings, 'id' | 'created_at'>)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data as UserSettings, { status: 201 })
}
