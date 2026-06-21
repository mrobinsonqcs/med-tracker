'use client'

import { useState } from 'react'

type SyringeVolume = '0.3ml' | '0.5ml' | '1ml'
type DoseUnit = 'mcg' | 'mg'

const SYRINGE_DATA: Record<SyringeVolume, { units: number; ml: number }> = {
  '0.3ml': { units: 30, ml: 0.3 },
  '0.5ml': { units: 50, ml: 0.5 },
  '1ml': { units: 100, ml: 1.0 },
}

type Result = {
  concentrationMcgPerMl: number
  mlToDraw: number
  unitMark: number
}

function calculate(
  vialMg: number,
  bacWaterMl: number,
  targetDoseMcg: number,
  syringe: SyringeVolume
): Result | null {
  if (!vialMg || !bacWaterMl || !targetDoseMcg) return null
  const vialMcg = vialMg * 1000
  const concentrationMcgPerMl = vialMcg / bacWaterMl
  const mlToDraw = targetDoseMcg / concentrationMcgPerMl
  const { units, ml } = SYRINGE_DATA[syringe]
  const mlPerUnit = ml / units
  const unitMark = mlToDraw / mlPerUnit

  return {
    concentrationMcgPerMl: Math.round(concentrationMcgPerMl * 100) / 100,
    mlToDraw: Math.round(mlToDraw * 1000) / 1000,
    unitMark: Math.round(unitMark * 10) / 10,
  }
}

export default function CalculatorPage() {
  const [vialMg, setVialMg] = useState('')
  const [bacWaterMl, setBacWaterMl] = useState('')
  const [targetDose, setTargetDose] = useState('')
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg')
  const [syringe, setSyringe] = useState<SyringeVolume>('0.5ml')

  const targetDoseMcg = doseUnit === 'mg'
    ? parseFloat(targetDose) * 1000
    : parseFloat(targetDose)

  const result = calculate(
    parseFloat(vialMg),
    parseFloat(bacWaterMl),
    targetDoseMcg,
    syringe
  )

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-white mb-1">Peptide Calculator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Calculate concentration and injection volume
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Vial amount (mg)</label>
          <input
            type="number"
            inputMode="decimal"
            value={vialMg}
            onChange={(e) => setVialMg(e.target.value)}
            placeholder="e.g. 5"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">BAC water added (ml)</label>
          <input
            type="number"
            inputMode="decimal"
            value={bacWaterMl}
            onChange={(e) => setBacWaterMl(e.target.value)}
            placeholder="e.g. 2"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Target dose</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={targetDose}
              onChange={(e) => setTargetDose(e.target.value)}
              placeholder={doseUnit === 'mcg' ? 'e.g. 200' : 'e.g. 0.2'}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <div className="flex bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setDoseUnit('mcg')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  doseUnit === 'mcg' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                mcg
              </button>
              <button
                type="button"
                onClick={() => setDoseUnit('mg')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  doseUnit === 'mg' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                mg
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Syringe volume</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SYRINGE_DATA) as SyringeVolume[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSyringe(s)}
                className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all border ${
                  syringe === s
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result ? (
        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Results</h2>

          <div className="grid grid-cols-1 gap-3">
            <ResultRow
              label="Concentration"
              value={`${result.concentrationMcgPerMl} mcg/ml`}
              sub="peptide per mL of solution"
            />
            <ResultRow
              label="Draw volume"
              value={`${result.mlToDraw} ml`}
              sub="amount to pull into syringe"
              highlight
            />
            <ResultRow
              label="Syringe mark"
              value={`${result.unitMark} units`}
              sub={`on a ${syringe} syringe`}
              highlight
            />
          </div>

          <p className="text-xs text-gray-600 pt-1 border-t border-gray-800">
            For informational purposes only. Verify all calculations before use.
          </p>
        </div>
      ) : (
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center text-gray-600 text-sm">
          Fill in all fields to see results
        </div>
      )}
    </div>
  )
}

function ResultRow({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${highlight ? 'bg-indigo-950 border border-indigo-800' : 'bg-gray-800'}`}>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
      </div>
      <p className={`text-lg font-semibold tabular-nums ${highlight ? 'text-indigo-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
