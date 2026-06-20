# Med Tracker

A personal medication reminder and peptide dosing calculator built with Next.js 14, Tailwind CSS, Supabase, and Resend.

## Features

- **Today** — daily medication checklist sorted by time of day, resets each day
- **My Meds** — add/remove medications with name, dose, schedule times, and color tag
- **Peptide Calculator** — calculate concentration, draw volume, and syringe unit mark from vial/BAC water/target dose
- **Cycle Log** — track peptide cycles with name, dose, frequency, duration, and start date
- **Email Reminders** — daily Resend emails sent via Vercel cron at morning/noon/evening/night

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd med-tracker
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (secret) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `CRON_SECRET` | Generate any random string (e.g. `openssl rand -hex 32`) |

### 3. Set up Supabase database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL editor and run the contents of `lib/supabase-schema.sql`

### 4. Configure Resend sender domain

In `app/api/cron/send-reminders/route.ts`, update the `from` field:

```ts
from: 'Med Tracker <reminders@yourdomain.com>',
```

You must verify your sending domain in the Resend dashboard.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel
2. Add all environment variables from `.env.local` to the Vercel project settings
3. Add `CRON_SECRET` to Vercel environment variables as well
4. Deploy — Vercel will automatically pick up the cron jobs from `vercel.json`

### Cron schedule

The cron jobs in `vercel.json` fire at:

| Time | UTC | Reminder for |
|---|---|---|
| 7:00 AM UTC | `0 7 * * *` | Morning |
| 12:00 PM UTC | `0 12 * * *` | Noon |
| 6:00 PM UTC | `0 18 * * *` | Evening |
| 9:00 PM UTC | `0 21 * * *` | Night |

Adjust these in `vercel.json` to match your timezone offset.

## Database Schema

See `lib/supabase-schema.sql` for the full schema. Tables:

- `medications` — name, dose, times[], color, user_email
- `daily_doses` — medication_id, date, time_of_day, taken, taken_at
- `cycle_log` — peptide_name, dose, frequency, duration, start_date, notes
- `user_settings` — email (for reminders)
