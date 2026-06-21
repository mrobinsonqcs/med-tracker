'use client'

import { useEffect, useState } from 'react'
import { Schedule, Frequency, Medication } from '@/lib/database.types'

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'every day', label: 'Every day' },
  { value: 'every other day', label: 'Every other day' },
  { value: 'every 3 days', label: 'Every 3 days' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ScheduleCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: Schedule
  onDelete: (id: string) => void
  onEdit: (entry: Schedule) => void
}) {
  const [confirming, setConfirming] = useState(false)

  const start = new Date(entry.start_date + 'T00:00:00')
  const now = new Date()
  let active = false

  if (entry.stop_date) {
    const stop = new Date(entry.stop_date + 'T00:00:00')
    active = now >= start && now <= stop
  } else {
    active = now >= start
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">{entry.medication_name}</span>
            {active && (
              <span className="text-xs bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-full px-2 py-0.5">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{entry.dose} · {entry.frequency}</p>
        </div>

        {confirming ? (
          <div className="flex gap-2 items-center flex-shrink-0">
            <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 px-2 py-1">
              Cancel
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs bg-red-600 text-white rounded-lg px-3 py-1"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(entry)}
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

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Start: {formatDate(entry.start_date)}</span>
        {entry.stop_date ? (
          <span>Stop: {formatDate(entry.stop_date)}</span>
        ) : (
          <span>Continuous use</span>
        )}
      </div>

      {entry.notes && (
        <p className="text-xs text-gray-500 mt-2 italic">{entry.notes}</p>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  medication_name: '',
  dose: '',
  frequency: 'every day' as Frequency,
  start_date: new Date().toISOString().split('T')[0],
  stop_date: '',
  notes: '',
}

export default function SchedulePage() {
  const [entries, setEntries] = useState<Schedule[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    Promise.all([
      fetch('/api/schedule').then((r) => r.json()),
      fetch('/api/medications').then((r) => r.json()),
    ]).then(([scheduleData, medsData]) => {
      setEntries(Array.isArray(scheduleData) ? scheduleData : [])
      setMedications(Array.isArray(medsData) ? medsData : [])
      setLoading(false)
    })
  }, [])

  const handleMedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const med = medications.find((m) => m.name === e.target.value)
    if (med) {
      setForm((p) => ({ ...p, medication_name: med.name, dose: med.dose }))
    } else {
      setForm((p) => ({ ...p, medication_name: '', dose: '' }))
    }
  }

  const openEdit = (entry: Schedule) => {
    setEditingId(entry.id)
    setForm({
      medication_name: entry.medication_name,
      dose: entry.dose,
      frequency: entry.frequency,
      start_date: entry.start_date,
      stop_date: entry.stop_date ?? '',
      notes: entry.notes ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM, start_date: new Date().toISOString().split('T')[0] })
  }

  const handleSave = async () => {
    if (!form.medication_name || !form.start_date) return
    setSaving(true)

    const payload = {
      medication_name: form.medication_name,
      dose: form.dose,
      frequency: form.frequency,
      start_date: form.start_date,
      stop_date: form.stop_date || null,
      notes: form.notes || null,
    }

    if (editingId) {
      const res = await fetch(`/api/schedule/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated: Schedule = await res.json()
        setEntries((prev) => prev.map((e) => (e.id === editingId ? updated : e)))
        closeForm()
      }
    } else {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const entry: Schedule = await res.json()
        setEntries((prev) => [entry, ...prev])
        closeForm()
      }
    }

    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    setEntries((prev) => prev.filter((e) => e.id !== id))
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
        <h1 className="text-2xl font-semibold text-white">Schedule</h1>
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
            {editingId ? 'Edit Schedule Entry' : 'New Schedule Entry'}
          </h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Medication</label>
            {medications.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                No medications saved yet — add some in My Meds first.
              </p>
            ) : (
              <select
                value={form.medication_name}
                onChange={handleMedSelect}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
              >
                <option value="">Select a medication…</option>
                {medications.map((med) => (
                  <option key={med.id} value={med.name}>
                    {med.name} — {med.dose}
                  </option>
                ))}
              </select>
            )}
          </div>

          {form.dose && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Dose</label>
              <input
                type="text"
                value={form.dose}
                onChange={(e) => setForm((p) => ({ ...p, dose: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, frequency: value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border text-left ${
                    form.frequency === value
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Stop Date <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="date"
                value={form.stop_date}
                onChange={(e) => setForm((p) => ({ ...p, stop_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
              />
              <p className="text-xs text-gray-600 mt-1">Blank = continuous use</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Protocol notes, observations, etc."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
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
              disabled={saving || !form.medication_name || !form.start_date}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No schedules yet</p>
          <p className="text-sm mt-1">Tap Add to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <ScheduleCard key={entry.id} entry={entry} onDelete={handleDelete} onEdit={openEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
