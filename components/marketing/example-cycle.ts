// One invented cycle, shared by every illustration on the start page so the
// hero, the scroll story and the social image all tell the same story.
// Example data only: no real person's readings.

export const EXAMPLE_TEMPS = [
  36.52, 36.48, 36.44, 36.41, 36.38, 36.42, 36.36, 36.4, 36.34, 36.38, 36.42, 36.36, 36.33, 36.4,
  36.38, 36.62, 36.74, 36.8, 36.77, 36.83, 36.79, 36.85, 36.8, 36.76, 36.82, 36.78, 36.7, 36.58,
]

// First higher reading of the rise (index, zero-based).
export const EXAMPLE_RISE_INDEX = 15

// Same rule as the app: the highest of the six readings before the rise.
export const EXAMPLE_GUIDE_LINE = Math.max(...EXAMPLE_TEMPS.slice(EXAMPLE_RISE_INDEX - 6, EXAMPLE_RISE_INDEX))

export const EXAMPLE_PERIOD_DAYS = 5

export function formatTemp(value: number, digits = 2) {
  return value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
