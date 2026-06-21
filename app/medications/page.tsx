'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Medication, TimeOfDay } from '@/lib/database.types'
import { createClient } from '@/lib/supabase-browser'

const TIMES: TimeOfDay[] = ['morning', 'noon', 'evening', 'night']
const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

const INSTRUCTION_OPTIONS = [
  'With food',
  'Without food',
  'With water',
  'Sublingual',
  'On empty stomach',
  'With milk',
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix', 'America/Toronto',
  'America/Vancouver', 'America/Mexico_City', 'America/Sao_Paulo',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
  'Europe/Amsterdam', 'Europe/Moscow', 'Africa/Cairo', 'Africa/Johannesburg',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Perth', 'Australia/Adelaide', 'Australia/Sydney', 'Pacific/Auckland',
]

function tzLabel(tz: string): string {
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? ''
  return `${tz.replace(/_/g, ' ')} (${offset})`
}

function MedCard({
  med,
  onDelete,
  onEdit,
}: {
  med: Medication
  onDelete: (id: string) => void
  onEdit: (med: Medication) => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
      <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: med.color }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{med.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">{med.dose}</p>
        {med.instructions && (
          <p className="text-indigo-400 text-xs mt-0.5">{med.instructions}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {(med.times as TimeOfDay[]).map((t) => (
            <span key={t} className="text-xs bg-gray-800 text-gray-300 rounded-md px-2 py-0.5">
              {TIME_LABELS[t]}
            </span>
          ))}
        </div>
      </div>
      {confirming ? (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-400 px-2 py-1"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(med.id)}
            className="text-xs bg-red-600 text-white rounded-lg px-3 py-1"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(med)}
            className="text-gray-600 hover:text-indigo-400 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default function MedicationsPage() {
  const router = useRouter()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [timezone, setTimezone] = useState('America/New_York')
  const [savingTz, setSavingTz] = useState(false)
  const [tzSaved, setTzSaved] = useState(false)

  const [form, setForm] = useState({
    name: '',
    dose: '',
    times: [] as TimeOfDay[],
    color: COLORS[0],
    instructions: '',
  })

  useEffect(() => {
    const fetchAll = async () => {
      const [medsRes, settingsRes] = await Promise.all([
        fetch('/api/medications'),
        fetch('/api/settings'),
      ])
      const meds = await medsRes.json()
      const settings = await settingsRes.json()
      setMedications(Array.isArray(meds) ? meds : [])
      if (settings?.timezone) setTimezone(settings.timezone)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const openEdit = (med: Medication) => {
    setEditingId(med.id)
    setForm({
      name: med.name,
      dose: med.dose,
      times: med.times as TimeOfDay[],
      color: med.color,
      instructions: med.instructions ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', dose: '', times: [], color: COLORS[0], instructions: '' })
  }

  const toggleTime = (time: TimeOfDay) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter((t) => t !== time)
        : [...prev.times, time],
    }))
  }

  const handleSave = async () => {
    if (!form.name || !form.dose || form.times.length === 0) return
    setSaving(true)
    const payload = { ...form, instructions: form.instructions || null }
    if (editingId) {
      const res = await fetch(`/api/medications/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated: Medication = await res.json()
        setMedications((prev) => prev.map((m) => (m.id === editingId ? updated : m)))
        closeForm()
      }
    } else {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const med: Medication = await res.json()
        setMedications((prev) => [...prev, med])
        closeForm()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/medications/${id}`, { method: 'DELETE' })
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSaveTimezone = async () => {
    setSavingTz(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone }),
    })
    setSavingTz(false)
    setTzSaved(true)
    setTimeout(() => setTzSaved(false), 2000)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">My Medications</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-300">
            {editingId ? 'Edit Medication' : 'New Medication'}
          </h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Metformin"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Dose</label>
            <input
              type="text"
              value={form.dose}
              onChange={(e) => setForm((p) => ({ ...p, dose: e.target.value }))}
              placeholder="e.g. 500mg"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Times of Day</label>
            <div className="grid grid-cols-2 gap-2">
              {TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    form.times.includes(time)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {TIME_LABELS[time]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Instructions (optional)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {INSTRUCTION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, instructions: p.instructions === opt ? '' : opt }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    form.instructions === opt
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              placeholder="Custom instructions..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={closeForm}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.dose || form.times.length === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {medications.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No medications yet</p>
          <p className="text-sm mt-1">Tap Add to get started</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {medications.map((med) => (
            <MedCard key={med.id} med={med} onDelete={handleDelete} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="mt-8 border-t border-gray-800 pt-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-gray-300 mb-1">Reminder Timezone</h2>
          <p className="text-xs text-gray-500 mb-3">
            Reminders will be sent at 6am, 11am, 4pm, and 8pm in this timezone.
          </p>
          <div className="flex gap-2">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tzLabel(tz)}</option>
              ))}
            </select>
            <button
              onClick={handleSaveTimezone}
              disabled={savingTz}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              {tzSaved ? '✓ Saved' : savingTz ? '…' : 'Save'}
            </button>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
