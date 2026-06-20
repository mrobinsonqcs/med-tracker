'use client'

import { useEffect, useState } from 'react'
import { CycleLog, Frequency } from '@/lib/database.types'

const FREQUENCIES: Frequency[] = ['daily', 'every other day', 'twice weekly', 'weekly', 'custom']

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function CycleCard({ cycle, onDelete }: { cycle: CycleLog; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)

  const start = new Date(cycle.start_date + 'T00:00:00')
  const durationDays = parseInt(cycle.duration)
  const end = new Date(start)
  if (!isNaN(durationDays)) end.setDate(end.getDate() + durationDays)
  const now = new Date()
  const active = !isNaN(durationDays) && now >= start && now <= end

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">{cycle.peptide_name}</span>
            {active && (
              <span className="text-xs bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-full px-2 py-0.5">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{cycle.dose} · {cycle.frequency}</p>
        </div>

        {confirming ? (
          <div className="flex gap-2 items-center flex-shrink-0">
            <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 px-2 py-1">
              Cancel
            </button>
            <button
              onClick={() => onDelete(cycle.id)}
              className="text-xs bg-red-600 text-white rounded-lg px-3 py-1"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Start: {formatDate(cycle.start_date)}</span>
        <span>Duration: {cycle.duration}</span>
      </div>

      {cycle.notes && (
        <p className="text-xs text-gray-500 mt-2 italic">{cycle.notes}</p>
      )}
    </div>
  )
}

export default function CycleLogPage() {
  const [cycles, setCycles] = useState<CycleLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    peptide_name: '',
    dose: '',
    frequency: 'daily' as Frequency,
    duration: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetch('/api/cycle-log')
      .then((r) => r.json())
      .then((data) => {
        setCycles(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  const handleAdd = async () => {
    if (!form.peptide_name || !form.dose || !form.duration || !form.start_date) return
    setSaving(true)
    const res = await fetch('/api/cycle-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const cycle: CycleLog = await res.json()
      setCycles((prev) => [cycle, ...prev])
      setForm({
        peptide_name: '',
        dose: '',
        frequency: 'daily',
        duration: '',
        start_date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/cycle-log/${id}`, { method: 'DELETE' })
    setCycles((prev) => prev.filter((c) => c.id !== id))
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
        <h1 className="text-2xl font-semibold text-white">Cycle Log</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Cycle
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-300">New Cycle Entry</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Peptide Name</label>
            <input
              type="text"
              value={form.peptide_name}
              onChange={(e) => setForm((p) => ({ ...p, peptide_name: e.target.value }))}
              placeholder="e.g. BPC-157"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Dose</label>
            <input
              type="text"
              value={form.dose}
              onChange={(e) => setForm((p) => ({ ...p, dose: e.target.value }))}
              placeholder="e.g. 250mcg"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, frequency: f }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border text-left ${
                    form.frequency === f
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Duration</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 30 days"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
              />
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
              onClick={() => {
                setShowForm(false)
                setForm({ peptide_name: '', dose: '', frequency: 'daily', duration: '', start_date: new Date().toISOString().split('T')[0], notes: '' })
              }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.peptide_name || !form.dose || !form.duration || !form.start_date}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {cycles.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No cycles logged yet</p>
          <p className="text-sm mt-1">Tap Log Cycle to add your first entry</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
