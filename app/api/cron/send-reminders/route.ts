import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase'
import type { Medication, DailyDose } from '@/lib/database.types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Reminder hours in the user's local timezone
const REMINDER_HOURS: Record<number, string> = {
  6: 'morning',
  11: 'noon',
  16: 'evening',
  20: 'night',
}

function getUserLocalHour(timezone: string): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }).format(new Date())
  return parseInt(hourStr, 10)
}

function getUserLocalDate(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const results: { userId: string; result: string }[] = []

  for (const user of users) {
    if (!user.email) continue

    // Get user's timezone
    const { data: settings } = await supabase
      .from('user_settings')
      .select('timezone')
      .eq('user_id', user.id)
      .single()

    const timezone = settings?.timezone ?? 'America/New_York'
    const localHour = getUserLocalHour(timezone)
    const timeOfDay = REMINDER_HOURS[localHour]

    if (!timeOfDay) {
      results.push({ userId: user.id, result: 'not a reminder hour' })
      continue
    }

    const today = getUserLocalDate(timezone)

    // Get medications with active schedule for today
    const { data: activeSchedules } = await supabase
      .from('cycle_log')
      .select('medication_name')
      .eq('user_id', user.id)
      .lte('start_date', today)
      .or(`stop_date.is.null,stop_date.gte.${today}`)

    if (!activeSchedules || activeSchedules.length === 0) {
      results.push({ userId: user.id, result: 'no active schedule' })
      continue
    }

    const activeNames = new Set(activeSchedules.map((s) => s.medication_name))

    const { data: medsRaw } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)

    const medications = ((medsRaw ?? []) as Medication[]).filter(
      (m) => activeNames.has(m.name) && (m.times as string[]).includes(timeOfDay)
    )

    if (medications.length === 0) {
      results.push({ userId: user.id, result: 'no medications due' })
      continue
    }

    // Check what's already been taken
    const { data: dosesRaw } = await supabase
      .from('daily_doses')
      .select('*')
      .in('medication_id', medications.map((m) => m.id))
      .eq('date', today)
      .eq('time_of_day', timeOfDay)

    const doses = (dosesRaw ?? []) as DailyDose[]
    const takenIds = new Set(doses.filter((d) => d.taken).map((d) => d.medication_id))
    const pendingMeds = medications.filter((m) => !takenIds.has(m.id))

    if (pendingMeds.length === 0) {
      results.push({ userId: user.id, result: 'all taken' })
      continue
    }

    const medList = pendingMeds
      .map((m) => `<li style="padding: 4px 0;"><strong>${m.name}</strong> — ${m.dose}</li>`)
      .join('')

    const timeLabel = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)

    await resend.emails.send({
      from: 'Med Tracker <reminders@yourdomain.com>',
      to: user.email,
      subject: `${timeLabel} medication reminder`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #6366f1; margin-bottom: 8px;">Time for your ${timeOfDay} medications</h2>
          <p style="color: #6b7280; margin-bottom: 16px;">${new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone }).format(new Date())}</p>
          <ul style="list-style: none; padding: 0; background: #f9fafb; border-radius: 8px; padding: 16px;">
            ${medList}
          </ul>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Open Med Tracker to mark these as taken.</p>
        </div>
      `,
    })

    results.push({ userId: user.id, result: `sent for ${pendingMeds.length} med(s)` })
  }

  return NextResponse.json({ results })
}
