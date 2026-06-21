'use client'

import { useEffect, useState, useCallback } from 'react'
import { Medication, DailyDose, TimeOfDay, Schedule } from '@/lib/database.types'

const TIME_ORDER: TimeOfDay[] = ['morning', 'noon', 'evening', 'night']
const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
}
const TIME_ICONS: Record<TimeOfDay, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌇',
  night: '🌙',
}

type DoseEntry = {
  med: Medication
  time: TimeOfDay
  dose: DailyDose | null
}

function getLast30Days(): string[] {
  const days: string[] = []
  const base = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function fromStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 29)
  return d.toISOString().split('T')[0]
}

function formatDayLabel(dateStr: string): string {
  const today = todayStr()
  const yesterday = yesterdayStr()
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTakenAt(takenAt: string | null): string {
  if (!takenAt) return 'Taken'
  return new Date(takenAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getActiveMeds(date: string, medications: Medication[], schedules: Schedule[]): Medication[] {
  const activeNames = new Set(
    schedules
      .filter((s) => s.start_date <= date && (s.stop_date == null || s.stop_date >= date))
      .map((s) => s.medication_name)
  )
  return medications.filter((m) => activeNames.has(m.name))
}

export default function HistoryPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [doses, setDoses] = useState<DailyDose[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<string | null>(null)
  const [selectedMed, setSelectedMed] = useState<string>('')

  const today = todayStr()
  const from = fromStr()

  const fetchData = useCallback(async () => {
    const [medsRes, schedsRes, dosesRes] = await Promise.all([
      fetch('/api/medications'),
      fetch('/api/schedule'),
      fetch(`/api/daily-doses?from=${from}&to=${today}`),
    ])
    const [meds, scheds, dosesData] = await Promise.all([
      medsRes.json(),
      schedsRes.json(),
      dosesRes.json(),
    ])
    setMedications(Array.isArray(meds) ? meds : [])
    setSchedules(Array.isArray(scheds) ? scheds : [])
    setDoses(Array.isArray(dosesData) ? dosesData : [])
    setLoading(false)
  }, [from, today])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDayEntries = useCallback(
    (date: string): DoseEntry[] => {
      const activeMeds = getActiveMeds(date, medications, schedules)
      const entries: DoseEntry[] = []
      for (const med of activeMeds) {
        for (const time of med.times as TimeOfDay[]) {
          const dose =
            doses.find(
              (d) => d.medication_id === med.id && d.time_of_day === time && d.date === date
            ) ?? null
          entries.push({ med, time, dose })
        }
      }
      return entries
    },
    [medications, schedules, doses]
  )

  const getFilteredEntries = useCallback(
    (date: string): DoseEntry[] => {
      const entries = getDayEntries(date)
      return selectedMed ? entries.filter((e) => e.med.name === selectedMed) : entries
    },
    [getDayEntries, selectedMed]
  )

  const toggleDose = async (med: Medication, time: TimeOfDay, date: string, current: DailyDose | null) => {
    const key = `${med.id}-${time}-${date}`
    setToggling(key)
    const newTaken = !current?.taken
    const res = await fetch('/api/daily-doses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication_id: med.id,
        date,
        time_of_day: time,
        taken: newTaken,
        taken_at: null,
      }),
    })
    if (res.ok) {
      const updated: DailyDose = await res.json()
      setDoses((prev) => {
        const filtered = prev.filter(
          (d) =>
            !(d.medication_id === updated.medication_id &&
              d.time_of_day === updated.time_of_day &&
              d.date === updated.date)
        )
        return [...filtered, updated]
      })
    }
    setToggling(null)
  }

  const allDays = getLast30Days()

  // Adherence: doses taken / doses scheduled across last 30 days
  let totalScheduled = 0
  let totalTaken = 0
  for (const date of allDays) {
    const entries = getFilteredEntries(date)
    totalScheduled += entries.length
    totalTaken += entries.filter((e) => e.dose?.taken).length
  }
  const adherencePct = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : null

  // Streak: consecutive days (newest first) where all scheduled doses taken
  let streak = 0
  for (const date of allDays) {
    const entries = getFilteredEntries(date)
    if (entries.length === 0) continue
    if (entries.every((e) => e.dose?.taken === true)) streak++
    else break
  }

  const toggleExpanded = (date: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(date)) { next.delete(date) } else { next.add(date) }
      return next
    })
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
        <h1 className="text-2xl font-semibold text-white">History</h1>
        <select
          value={selectedMed}
          onChange={(e) => setSelectedMed(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
        >
          <option value="">All medications</option>
          {medications.map((med) => (
            <option key={med.id} value={med.name}>
              {med.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-400">
            {adherencePct !== null ? `${adherencePct}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">30-day adherence</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{streak}</p>
          <p className="text-xs text-gray-500 mt-1">
            {streak === 1 ? 'day streak' : 'day streak'}
          </p>
        </div>
      </div>

      {/* Day list */}
      <div className="space-y-2">
        {allDays.map((date) => {
          const entries = getFilteredEntries(date)
          const taken = entries.filter((e) => e.dose?.taken).length
          const total = entries.length
          const isExpanded = expanded.has(date)
          const allTaken = total > 0 && taken === total

          // Group by time for expanded view
          const byTime = TIME_ORDER.reduce((acc, time) => {
            acc[time] = entries.filter((e) => e.time === time)
            return acc
          }, {} as Record<TimeOfDay, DoseEntry[]>)

          return (
            <div key={date} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Day header */}
              <button
                onClick={() => toggleExpanded(date)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{formatDayLabel(date)}</span>
                  {total > 0 && allTaken && (
                    <span className="text-xs bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-full px-2 py-0.5">
                      Perfect
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {total > 0 ? (
                    <span className={`text-xs tabular-nums ${allTaken ? 'text-emerald-400' : taken > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {taken}/{total}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-800 px-4 pb-3 pt-2">
                  {total === 0 ? (
                    <p className="text-xs text-gray-600 py-2 text-center">No medications scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {TIME_ORDER.map((time) => {
                        const group = byTime[time]
                        if (group.length === 0) return null
                        return (
                          <div key={time}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-xs">{TIME_ICONS[time]}</span>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {TIME_LABELS[time]}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {group.map(({ med, dose }) => {
                                const isTaken = dose?.taken ?? false
                                const key = `${med.id}-${time}-${date}`
                                const isToggling = toggling === key
                                return (
                                  <button
                                    key={key}
                                    onClick={() => toggleDose(med, time, date, dose)}
                                    disabled={isToggling}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${
                                      isTaken
                                        ? 'bg-gray-800 border-gray-700'
                                        : 'bg-gray-850 border-gray-800 hover:border-gray-700'
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        isTaken ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
                                      }`}
                                    >
                                      {isTaken && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${isTaken ? 'text-gray-400' : 'text-white'}`}>
                                        {med.name}
                                      </p>
                                      <p className="text-xs text-gray-600">{med.dose}</p>
                                    </div>
                                    <span className={`text-xs flex-shrink-0 ${isTaken ? 'text-gray-500' : 'text-red-400'}`}>
                                      {isTaken ? formatTakenAt(dose?.taken_at ?? null) : 'Missed'}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
