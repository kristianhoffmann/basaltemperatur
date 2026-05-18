import { describe, expect, it } from 'vitest'
import {
  detectOvulation,
  predictNextOvulation,
  predictNextPeriod,
  getFertilityWindow,
  getFertilityStatus,
  getFutureWindows,
  combineOvulationsWithPredictions,
} from './ovulation'

describe('ovulation calculations', () => {
  it('detects ovulation with the 3-over-6 rule', () => {
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

    expect(result.ovulationDate).toBe('2026-01-06')
    expect(result.coverLineTemp).toBe(36.4)
    expect(result.phase).toBe('luteal')
    expect(result.isConfirmed).toBe(true)
    expect(result.source).toBe('temperature')
  })

  it('does not confirm ovulation across skipped calendar days', () => {
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

  it('does not use spotting as a cycle start for predictions', () => {
    const result = combineOvulationsWithPredictions([], [
      { date: '2026-01-01', flow_intensity: 'spotting' },
      { date: '2026-01-05', flow_intensity: 'medium' },
    ], 28)

    expect(result).toHaveLength(1)
    expect(result[0].ovulationDate).toBe('2026-01-19')
    expect(result[0].isConfirmed).toBe(false)
  })

  it('predicts next ovulation and period from last period start', () => {
    expect(predictNextOvulation('2026-02-01', 28, 14)).toBe('2026-02-15')
    expect(predictNextPeriod('2026-02-01', 28)).toBe('2026-03-01')
  })

  it('calculates fertility window and status correctly', () => {
    const window = getFertilityWindow('2026-02-01', 28, 14)

    expect(window).toEqual({
      start: '2026-02-10',
      end: '2026-02-16',
      peakStart: '2026-02-14',
      peakEnd: '2026-02-15',
    })

    expect(getFertilityStatus('2026-02-14', window)).toBe('peak')
    expect(getFertilityStatus('2026-02-11', window)).toBe('fertile')
    expect(getFertilityStatus('2026-02-20', window)).toBe('infertile')
  })

  it('creates multiple future fertility windows', () => {
    const windows = getFutureWindows('2026-02-01', 28, 14, 3)

    expect(windows).toHaveLength(3)
    expect(windows[0].start).toBe('2026-02-10')
    expect(windows[1].start).toBe('2026-03-10')
    expect(windows[2].start).toBe('2026-04-06')
  })
})
