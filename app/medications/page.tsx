'use client'

import { useEffect, useState } from 'react'
import { Medication, TimeOfDay } from '@/lib/database.types'

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


function MedCard({ med, onDelete }: { med: Medication; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
      <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: med.color }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{med.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">{med.dose}</p>
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
        <button
          onClick={() => setConfirming(true)}
          className="text-gray-600 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)

  const [form, setForm] = useState({
    name: '',
    dose: '',
    times: [] as TimeOfDay[],
    color: COLORS[0],
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
      if (settings?.email) setEmail(settings.email)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const toggleTime = (time: TimeOfDay) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter((t) => t !== time)
        : [...prev.times, time],
    }))
  }

  const handleAdd = async () => {
    if (!form.name || !form.dose || form.times.length === 0) return
    setSaving(true)
    const res = await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const med: Medication = await res.json()
      setMedications((prev) => [...prev, med])
      setForm({ name: '', dose: '', times: [], color: COLORS[0] })
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/medications/${id}`, { method: 'DELETE' })
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSaveEmail = async () => {
    if (!email) return
    setSavingEmail(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSavingEmail(false)
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2000)
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
          <h2 className="text-sm font-medium text-gray-300">New Medication</h2>

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
              onClick={() => { setShowForm(false); setForm({ name: '', dose: '', times: [], color: COLORS[0] }) }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.name || !form.dose || form.times.length === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
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
            <MedCard key={med.id} med={med} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-gray-800 pt-6">
        <h2 className="text-sm font-medium text-gray-300 mb-1">Reminder Email</h2>
        <p className="text-xs text-gray-500 mb-3">
          Daily reminder emails will be sent to this address.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleSaveEmail}
            disabled={savingEmail || !email}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            {emailSaved ? '✓ Saved' : savingEmail ? '…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
