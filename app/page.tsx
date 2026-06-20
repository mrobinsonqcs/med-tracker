'use client'

import { useEffect, useState, useCallback } from 'react'
import { Medication, DailyDose, TimeOfDay } from '@/lib/database.types'

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
  medication: Medication
  timeOfDay: TimeOfDay
  dose: DailyDose | null
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function TodayPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [doses, setDoses] = useState<DailyDose[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const today = todayStr()

  const fetchData = useCallback(async () => {
    const [medsRes, dosesRes] = await Promise.all([
      fetch('/api/medications'),
      fetch(`/api/daily-doses?date=${today}`),
    ])
    const [meds, dosesData] = await Promise.all([medsRes.json(), dosesRes.json()])
    setMedications(Array.isArray(meds) ? meds : [])
    setDoses(Array.isArray(dosesData) ? dosesData : [])
    setLoading(false)
  }, [today])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getEntries = (): Record<TimeOfDay, DoseEntry[]> => {
    const result: Record<TimeOfDay, DoseEntry[]> = {
      morning: [],
      noon: [],
      evening: [],
      night: [],
    }
    for (const med of medications) {
      for (const time of med.times as TimeOfDay[]) {
        const dose = doses.find(
          (d) => d.medication_id === med.id && d.time_of_day === time
        ) ?? null
        result[time].push({ medication: med, timeOfDay: time, dose })
      }
    }
    return result
  }

  const toggleDose = async (entry: DoseEntry) => {
    const key = `${entry.medication.id}-${entry.timeOfDay}`
    setToggling(key)
    const newTaken = !entry.dose?.taken
    const body = {
      medication_id: entry.medication.id,
      date: today,
      time_of_day: entry.timeOfDay,
      taken: newTaken,
      taken_at: newTaken ? new Date().toISOString() : null,
    }
    const res = await fetch('/api/daily-doses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated: DailyDose = await res.json()
      setDoses((prev) => {
        const filtered = prev.filter(
          (d) => !(
            d.medication_id === updated.medication_id &&
            d.time_of_day === updated.time_of_day &&
            d.date === updated.date
          )
        )
        return [...filtered, updated]
      })
    }
    setToggling(null)
  }

  const entries = getEntries()
  const allEntries = Object.values(entries).flat()
  const takenCount = allEntries.filter((e) => e.dose?.taken).length
  const totalCount = allEntries.length

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Today</h1>
        <p className="text-gray-400 text-sm mt-0.5">{dateLabel}</p>
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{takenCount} of {totalCount} taken</span>
              <span>{Math.round((takenCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(takenCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No medications scheduled</p>
          <p className="text-sm mt-1">
            Add some in <span className="text-indigo-400">My Meds</span>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {TIME_ORDER.map((time) => {
            const group = entries[time]
            if (group.length === 0) return null
            return (
              <section key={time}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{TIME_ICONS[time]}</span>
                  <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    {TIME_LABELS[time]}
                  </h2>
                </div>
                <div className="space-y-2">
                  {group.map((entry) => {
                    const taken = entry.dose?.taken ?? false
                    const key = `${entry.medication.id}-${entry.timeOfDay}`
                    const isToggling = toggling === key
                    return (
                      <button
                        key={key}
                        onClick={() => toggleDose(entry)}
                        disabled={isToggling}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                          taken
                            ? 'bg-gray-900 border-gray-800 opacity-60'
                            : 'bg-gray-900 border-gray-800 hover:border-gray-700 active:scale-[0.99]'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.medication.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${taken ? 'line-through text-gray-500' : 'text-white'}`}>
                            {entry.medication.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{entry.medication.dose}</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            taken ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
                          }`}
                        >
                          {taken && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
