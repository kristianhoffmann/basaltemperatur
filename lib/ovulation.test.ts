import { describe, expect, it } from 'vitest'
import * as analysis from './ovulation'
import { detectOvulation, predictNextPeriod } from './ovulation'

describe('temperature curve analysis', () => {
  it('marks the first higher reading of a rise confirmed by the 3-over-6 rule', () => {
    const entries = [
      { date: '2026-01-01', temperature: 36.4 },
      { date: '2026-01-02', temperature: 36.3 },
      { date: '2026-01-03', temperature: 36.2 },
      { date: '2026-01-04', temperature: 36.3 },
      { date: '2026-01-05', temperature: 36.4 },
      { date: '2026-01-06', temperature: 36.3 },
      { date: '2026-01-07', temperature: 36.6 },
      { date: '2026-01-08', temperature: 36.7 },
      { date: '2026-01-09', temperature: 36.8 },
    ]

    const result = detectOvulation(entries)

    expect(result.ovulationDate).toBe('2026-01-07')
    expect(result.coverLineTemp).toBe(36.4)
    expect(result.phase).toBe('luteal')
    expect(result.isConfirmed).toBe(true)
    expect(result.source).toBe('temperature')
  })

  it('does not confirm a rise across skipped calendar days', () => {
    const entries = [
      { date: '2026-01-01', temperature: 36.4 },
      { date: '2026-01-02', temperature: 36.3 },
      { date: '2026-01-03', temperature: 36.2 },
      { date: '2026-01-04', temperature: 36.3 },
      { date: '2026-01-05', temperature: 36.4 },
      { date: '2026-01-06', temperature: 36.3 },
      { date: '2026-01-08', temperature: 36.6 },
      { date: '2026-01-09', temperature: 36.7 },
      { date: '2026-01-10', temperature: 36.8 },
    ]

    const result = detectOvulation(entries)

    expect(result.ovulationDate).toBeNull()
    expect(result.isConfirmed).toBe(false)
  })

  it('excludes disturbed values from temperature confirmation', () => {
    const entries = [
      { date: '2026-01-01', temperature: 36.4 },
      { date: '2026-01-02', temperature: 36.3 },
      { date: '2026-01-03', temperature: 36.2 },
      { date: '2026-01-04', temperature: 36.3 },
      { date: '2026-01-05', temperature: 36.4 },
      { date: '2026-01-06', temperature: 36.3 },
      { date: '2026-01-07', temperature: 36.6, disturbed: true },
      { date: '2026-01-08', temperature: 36.7 },
      { date: '2026-01-09', temperature: 36.8 },
      { date: '2026-01-10', temperature: 36.9 },
    ]

    const result = detectOvulation(entries)

    expect(result.ovulationDate).toBeNull()
    expect(result.isConfirmed).toBe(false)
    expect(result.reason).toContain('Kein bestätigter')
  })

  it('estimates the next period start from the last one', () => {
    expect(predictNextPeriod('2026-02-01', 28)).toBe('2026-03-01')
  })

  // Regulatory guard: predicting ovulation or a fertile window would turn the diary
  // into a medical device. These functions were removed on purpose; do not bring
  // them back without a conformity assessment.
  it('exposes no ovulation or fertile-window prediction', () => {
    const forbidden = /fertil|fruchtbar|predictnextovulation|futurewindows|combineovulationswithpredictions/i
    expect(Object.keys(analysis).filter((name) => forbidden.test(name))).toEqual([])
  })
})
