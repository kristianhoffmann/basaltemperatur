// lib/curve-sheet.ts
// Geometry and input parsing for the public curve tool (/werkzeuge/basaltemperaturkurve).
//
// ZWECKBESTIMMUNG: Dieses Modul zeichnet nur, was eingegeben wurde. Es erkennt
// keinen Anstieg, bestimmt keine fruchtbaren Tage und keinen Eisprung. Die
// rückblickende Auswertung bleibt in lib/ovulation.ts und hinter dem Konto.

export const SHEET_MAX_DAYS = 45
export const SHEET_DEFAULT_DAYS = 35
// Plausibility bounds for typed readings, not medical reference values.
export const READING_MIN = 35
export const READING_MAX = 38.5

export type Reading = number | null

export type ParsedReadings = {
  values: Reading[]
  invalid: string[]
  truncated: boolean
}

// One reading per line (or separated by semicolons/whitespace). A comma is the
// German decimal separator, never a list separator. "-", "x" or "?" mark a day
// without a measurement so the following days keep their position.
export function parseReadings(text: string): ParsedReadings {
  const tokens = text.split(/[\s;]+/).map((token) => token.trim()).filter(Boolean)
  const values: Reading[] = []
  const invalid: string[] = []
  for (const token of tokens) {
    if (/^[-–x?]$/i.test(token)) { values.push(null); continue }
    const normalized = token.replace(',', '.')
    const value = /^\d{2}(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN
    if (Number.isFinite(value) && value >= READING_MIN && value <= READING_MAX) values.push(Math.round(value * 100) / 100)
    else invalid.push(token)
  }
  return { values: values.slice(0, SHEET_MAX_DAYS), invalid, truncated: values.length > SHEET_MAX_DAYS }
}

// Temperature band of the sheet. Paper charts usually span 36,0–37,2 °C; the band
// widens in 0,1-steps when typed readings fall outside it.
export function sheetRange(values: Reading[]): { low: number; high: number } {
  const numbers = values.filter((value): value is number => value !== null)
  if (!numbers.length) return { low: 36.0, high: 37.2 }
  const low = Math.min(36.0, Math.floor((Math.min(...numbers) - 0.05) * 10) / 10)
  const high = Math.max(37.2, Math.ceil((Math.max(...numbers) + 0.05) * 10) / 10)
  return { low: round1(Math.max(low, READING_MIN)), high: round1(Math.min(high, READING_MAX)) }
}

const round1 = (value: number) => Math.round(value * 10) / 10

export type ReadingSummary = { count: number; missing: number; min: number | null; max: number | null }

// Plain description of the typed values. No interpretation.
export function summarizeReadings(values: Reading[]): ReadingSummary {
  const numbers = values.filter((value): value is number => value !== null)
  return {
    count: numbers.length,
    missing: values.length - numbers.length,
    min: numbers.length ? Math.min(...numbers) : null,
    max: numbers.length ? Math.max(...numbers) : null,
  }
}

export function formatCelsius(value: number, digits = 2) {
  return value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
