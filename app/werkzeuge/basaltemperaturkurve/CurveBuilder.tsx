'use client'

import { useMemo, useState } from 'react'
import { CurveSheet } from '@/components/curve/CurveSheet'
import { formatCelsius, parseReadings, sheetRange, SHEET_DEFAULT_DAYS, SHEET_MAX_DAYS, summarizeReadings } from '@/lib/curve-sheet'

// Prints exactly one sheet: globals.css hides everything else while
// body[data-print-target] is set, and the attribute is removed afterwards.
export function PrintSheetButton({ target, label }: { target: 'vorlage' | 'eigene-kurve'; label: string }) {
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={() => {
        document.body.dataset.printTarget = target
        const reset = () => { delete document.body.dataset.printTarget; window.removeEventListener('afterprint', reset) }
        window.addEventListener('afterprint', reset)
        window.print()
      }}
    >
      {label}
    </button>
  )
}

export function CurveBuilder({ example }: { example: string }) {
  const [text, setText] = useState(example)
  const parsed = useMemo(() => parseReadings(text), [text])
  const range = sheetRange(parsed.values)
  const days = Math.min(SHEET_MAX_DAYS, Math.max(SHEET_DEFAULT_DAYS, parsed.values.length))
  const summary = summarizeReadings(parsed.values)
  const isExample = text === example

  return (
    <div className="paper-grid space-y-5 rounded-2xl border border-[var(--card-border)] p-5 text-[var(--text)] shadow-card sm:p-7">
      <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="kurve-werte">
        Deine Werte in °C, ein Wert pro Zeile ab Zyklustag 1. Für einen Tag ohne Messung schreibst du „-“.
      </label>
      {/* No name attribute: the readings must never be submitted or end up in a URL. */}
      <textarea
        id="kurve-werte"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        spellCheck={false}
        inputMode="decimal"
        className="input min-h-[10rem] font-mono tabular-nums"
      />
      <p className="text-sm text-[var(--text-secondary)]">
        Die Kurve entsteht nur in deinem Browser. Deine Werte werden weder übertragen noch gespeichert; nach dem Neuladen sind sie weg.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setText('')}>Werte leeren</button>
        {!isExample && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setText(example)}>Beispiel wieder laden</button>}
        <PrintSheetButton target="eigene-kurve" label="Diese Kurve drucken" />
      </div>
      {parsed.invalid.length > 0 && (
        <p role="alert" className="text-sm text-red-700">
          Nicht übernommen: {parsed.invalid.slice(0, 5).join(', ')}{parsed.invalid.length > 5 ? ' …' : ''}. Erlaubt sind Werte zwischen 35,00 und 38,50 °C mit Komma oder Punkt.
        </p>
      )}
      {parsed.truncated && <p role="alert" className="text-sm text-red-700">Es werden höchstens {SHEET_MAX_DAYS} Tage gezeichnet.</p>}
      <div id="eigene-kurve" className="print-sheet overflow-x-auto rounded-xl border border-[var(--card-border)] bg-white p-2">
        <p className="px-2 pt-1 text-sm font-semibold">{isExample ? 'Beispielkurve (erfundene Werte)' : 'Deine Basaltemperaturkurve'}</p>
        <div className="min-w-[640px]">
          <CurveSheet days={days} low={range.low} high={range.high} values={parsed.values} title={isExample ? 'Beispielkurve mit erfundenen Werten' : 'Basaltemperaturkurve aus deinen Eingaben'} />
        </div>
      </div>
      <p role="status" className="text-sm text-[var(--text-secondary)]">
        {summary.count === 0
          ? 'Noch keine Werte eingetragen.'
          : `${summary.count} Werte eingetragen${summary.missing ? `, ${summary.missing} Tage ohne Messung` : ''}. Niedrigster Wert ${formatCelsius(summary.min!)} °C, höchster ${formatCelsius(summary.max!)} °C.`}
      </p>
      <noscript>Zum Zeichnen eigener Werte aktiviere JavaScript. Die leere Vorlage weiter unten kannst du auch ohne JavaScript über die Druckfunktion des Browsers ausdrucken.</noscript>
    </div>
  )
}
