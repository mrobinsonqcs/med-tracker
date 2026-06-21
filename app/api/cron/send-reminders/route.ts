import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'
import { HARDCODED_USER_ID } from '@/lib/constants'
import type { Medication, DailyDose, UserSettings } from '@/lib/database.types'

const resend = new Resend(process.env.RESEND_API_KEY)

function currentTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 14) return 'noon'
  if (hour >= 17 && hour < 21) return 'evening'
  if (hour >= 21 || hour < 5) return 'night'
  return ''
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const timeOfDay = currentTimeOfDay()

  if (!timeOfDay) {
    return NextResponse.json({ message: 'No reminders for this time' })
  }

  const { data: settingsRaw } = await supabase
    .from('user_settings')
    .select('email')
    .eq('user_id', HARDCODED_USER_ID)
    .single()

  const settings = settingsRaw as Pick<UserSettings, 'email'> | null

  if (!settings?.email) {
    return NextResponse.json({ message: 'No user email configured' })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: medsRaw } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', HARDCODED_USER_ID)

  const medications = (medsRaw ?? []) as Medication[]

  const dueMeds = medications.filter((med) =>
    (med.times as string[]).includes(timeOfDay)
  )

  if (dueMeds.length === 0) {
    return NextResponse.json({ message: 'No medications due' })
  }

  const { data: dosesRaw } = await supabase
    .from('daily_doses')
    .select('*')
    .eq('date', today)
    .eq('time_of_day', timeOfDay)

  const doses = (dosesRaw ?? []) as DailyDose[]
  const takenIds = new Set(doses.filter((d) => d.taken).map((d) => d.medication_id))
  const pendingMeds = dueMeds.filter((m) => !takenIds.has(m.id))

  if (pendingMeds.length === 0) {
    return NextResponse.json({ message: 'All medications already taken' })
  }

  const medList = pendingMeds
    .map((m) => `<li style="padding: 4px 0;"><strong>${m.name}</strong> — ${m.dose}</li>`)
    .join('')

  const timeLabel = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)

  await resend.emails.send({
    from: 'Med Tracker <reminders@yourdomain.com>',
    to: settings.email,
    subject: `${timeLabel} medication reminder`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #6366f1; margin-bottom: 8px;">Time for your ${timeOfDay} medications</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <ul style="list-style: none; padding: 0; background: #f9fafb; border-radius: 8px; padding: 16px;">
          ${medList}
        </ul>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Open Med Tracker to mark these as taken.</p>
      </div>
    `,
  })

  return NextResponse.json({ message: `Reminder sent for ${pendingMeds.length} medication(s)` })
}
