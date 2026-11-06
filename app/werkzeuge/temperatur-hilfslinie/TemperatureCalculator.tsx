'use client'

import { useState, type FormEvent } from 'react'
import { calculateCoverLine } from '@/lib/ovulation'

export function TemperatureCalculator({ example, from }: { example: number[]; from?: string }) {
  const [values, setValues] = useState(() => example.map(String))
  const [result, setResult] = useState(() => calculateCoverLine(example))
  const [isExample, setIsExample] = useState(true)
  const [error, setError] = useState(false)
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numbers = values.map((value) => /^\d{2}(?:[.,]\d{1,2})?$/.test(value) ? Number(value.replace(',', '.')) : NaN)
    const valid = numbers.length === 6 && numbers.every((value) => Number.isFinite(value) && value >= 30 && value <= 45)
    setError(!valid)
    setResult(valid ? calculateCoverLine(numbers) : null)
    setIsExample(false)
  }
  return <form action="/werkzeuge/temperatur-hilfslinie" method="get" onSubmit={calculate} className="space-y-5 rounded-2xl border bg-white p-6">
    {from && <input type="hidden" name="from" value={from} />}
    <p>Trage sechs ungestörte Messwerte in °C ein. Die Eingabegrenzen dienen nur der Plausibilitätsprüfung und sind keine medizinischen Referenzwerte.</p>
    <p className="text-sm">Die Rechnung läuft nur in deinem Browser. Deine Temperaturwerte werden weder übertragen noch gespeichert.</p>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {values.map((value, index) => <label key={index} className="block text-sm">Messwert {index + 1} (°C)
        {/* No name: even a native form submission without JS must not transmit health data. */}
        <input type="number" min="30" max="45" step="0.01" required value={value} onChange={(event) => setValues((previous) => previous.map((item, position) => position === index ? event.target.value : item))} className="mt-2 w-full rounded-lg border p-3 text-slate-900" />
      </label>)}
    </div>
    <button type="submit" className="rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white">Hilfslinie berechnen</button>
    <p role="status" className="text-xl font-bold">{result !== null && <>{isExample ? 'Beispiel-Hilfslinie' : 'Deine Hilfslinie'}: {result.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} °C</>}</p>
    {error && <p role="alert">Bitte gib sechs gültige Temperaturwerte zwischen 30 und 45 °C ein.</p>}
    <noscript>Für eigene Berechnungen aktiviere JavaScript. Methodik und Beispielrechnung kannst du auch ohne JavaScript lesen.</noscript>
  </form>
}
