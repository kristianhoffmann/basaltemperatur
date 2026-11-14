// lib/ovulation.ts
// Rückblickende Auswertung der Temperaturkurve ("3-über-6-Regel").
//
// ZWECKBESTIMMUNG (bitte nicht aufweichen): Die App ist ein Tagebuch. Dieses Modul
// beschreibt nur, was in den eingetragenen Werten zu sehen ist — einen
// Temperaturanstieg und die Hilfslinie davor. Es berechnet bewusst KEINEN
// Eisprungtermin, KEIN fruchtbares Fenster und KEINE Vorhersage dafür. Solche
// Funktionen würden die App zu einem Medizinprodukt machen (Verordnung (EU)
// 2017/745, "Kontrolle oder Unterstützung der Empfängnis"). Der Test in
// lib/ovulation.test.ts sichert das ab.
//
// Die Bezeichner (OvulationResult, ovulationDate) sind historisch und bleiben aus
// Kompatibilitätsgründen; `ovulationDate` ist das Datum der ERSTEN HÖHEREN MESSUNG.
//
// "3-über-6-Regel":
// - Ein Anstieg gilt als bestätigt, wenn 3 aufeinanderfolgende Temperaturen
//   über den 6 vorhergehenden Werten liegen
// - Mindestens der 3. Wert muss 0.2°C über der höchsten der 6 vorherigen liegen

import { TemperatureEntry } from '@/types/database'

export interface OvulationResult {
    ovulationDate: string | null
    coverLineTemp: number | null
    phase: 'follicular' | 'ovulation' | 'luteal' | 'unknown'
    cycleDay: number | null
    source: 'temperature' | 'prediction'
    confidence: 'high' | 'medium' | 'low'
    isConfirmed: boolean
    reason?: string
}

export interface ChartDataPoint {
    date: string
    temperature: number | null
    isPeriod: boolean
    isOvulation: boolean
    flowIntensity?: 'light' | 'medium' | 'heavy' | 'spotting'
}

type TemperatureInput = Pick<TemperatureEntry, 'date' | 'temperature'> & Partial<Pick<
    TemperatureEntry,
    'disturbed' | 'exclude_from_analysis' | 'cervical_mucus'
>>

type PeriodInput = Pick<import('@/types/database').PeriodEntry, 'date'> & Partial<Pick<
    import('@/types/database').PeriodEntry,
    'flow_intensity'
>>

const DAY_MS = 1000 * 60 * 60 * 24

function daysBetween(a: string, b: string): number {
    const start = new Date(`${a}T00:00:00`)
    const end = new Date(`${b}T00:00:00`)
    return Math.round((end.getTime() - start.getTime()) / DAY_MS)
}

function hasConsecutiveDates(entries: Pick<TemperatureEntry, 'date'>[]): boolean {
    for (let i = 1; i < entries.length; i++) {
        if (daysBetween(entries[i - 1].date, entries[i].date) !== 1) return false
    }
    return true
}

function getEligibleTemperatureEntries<T extends TemperatureInput>(entries: T[]): T[] {
    return [...entries]
        .filter((entry) =>
            !entry.disturbed &&
            !entry.exclude_from_analysis &&
            entry.temperature !== null &&
            entry.temperature !== undefined &&
            Number.isFinite(Number(entry.temperature))
        )
        .sort((a, b) => a.date.localeCompare(b.date))
}

function temperatureResult(
    entries: Pick<TemperatureEntry, 'date' | 'temperature'>[],
    ovulationIndex: number,
    coverLineTemp: number | null,
): OvulationResult {
    return {
        ovulationDate: entries[ovulationIndex]?.date || null,
        coverLineTemp,
        phase: 'luteal',
        cycleDay: calculateCycleDay(entries, ovulationIndex),
        source: 'temperature',
        confidence: 'high',
        isConfirmed: true,
        reason: 'Temperaturanstieg nach 3-über-6-Regel bestätigt',
    }
}

function unknownResult(reason: string): OvulationResult {
    return {
        ovulationDate: null,
        coverLineTemp: null,
        phase: 'unknown',
        cycleDay: null,
        source: 'temperature',
        confidence: 'low',
        isConfirmed: false,
        reason,
    }
}

/**
 * Berechnet die Hilfslinie:
 * = der HÖCHSTE Wert der 6 niedrigen Temperaturen vor dem Anstieg
 */
export function calculateCoverLine(temperatures: number[]): number | null {
    if (temperatures.length < 6) return null
    const lastSix = temperatures.slice(-6)
    return Math.round(Math.max(...lastSix) * 100) / 100
}

/**
 * Berechnet den Zyklustag basierend auf der tatsächlichen Datumsdifferenz
 * (nicht dem Array-Index, da Benutzer Tage überspringen können)
 */
function calculateCycleDay(
    entries: Pick<TemperatureEntry, 'date' | 'temperature'>[],
    ovulationIndex: number
): number | null {
    if (ovulationIndex < 0 || ovulationIndex >= entries.length) return null
    const firstDate = new Date(entries[0].date)
    const ovDate = new Date(entries[ovulationIndex].date)
    const diffMs = ovDate.getTime() - firstDate.getTime()
    return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Erkennt rückblickend einen Temperaturanstieg nach der 3-über-6-Regel
 * 
 * Regeln:
 * - 3 aufeinanderfolgende Werte müssen ÜBER der Hilfslinie (= Maximum der 6 Vorwerte) liegen
 * - Der 3. Wert muss mindestens 0.2°C über der Hilfslinie liegen
 * 
 * Ausnahmeregel 1: Ist der 3. Wert weniger als 0.2°C über der Hilfslinie,
 *   muss ein 4. Wert abgewartet werden, der über der Hilfslinie liegt
 * 
 * Ausnahmeregel 2: Fällt einer der 3 Werte auf/unter die Hilfslinie,
 *   wird er ausgeklammert und es werden insgesamt 4 Messungen über der Hilfslinie benötigt
 * 
 * @param entries - Temperatureinträge, sortiert nach Datum aufsteigend
 * @returns Datum der ersten höheren Messung und Hilfslinie
 */
export function detectOvulation(
    entries: TemperatureInput[]
): OvulationResult {
    const eligibleEntries = getEligibleTemperatureEntries(entries)

    if (eligibleEntries.length < 9) {
        return unknownResult('Nicht genug auswertbare, ungestörte Temperaturwerte')
    }

    const temps = eligibleEntries.map(e => Number(e.temperature))

    // Suche nach dem Temperaturanstieg (3-über-6-Regel mit Ausnahmeregeln)
    for (let i = 6; i <= temps.length - 3; i++) {
        const windowEntries = eligibleEntries.slice(i - 6, Math.min(i + 4, eligibleEntries.length))
        if (!hasConsecutiveDates(windowEntries.slice(0, 9))) continue

        const previousSix = temps.slice(i - 6, i)
        const coverLine = Math.max(...previousSix) // Hilfslinie = Maximum der 6 Vorwerte

        // Prüfe die nachfolgenden Werte (mindestens 3, ggf. 4 bei Ausnahmeregeln)
        const available = temps.slice(i, Math.min(i + 4, temps.length))
        if (available.length < 3) continue

        const first3 = available.slice(0, 3)
        const allAbove = first3.every(t => t > coverLine)
        const thirdHighEnough = Math.round(first3[2] * 100) >= Math.round((coverLine + 0.2) * 100)

        if (allAbove && thirdHighEnough) {
            // Standard-Regel: 3 über 6, 3. ≥ coverLine + 0.2°C
            const coverLineValue = calculateCoverLine(previousSix)
            const ovulationIndex = i // first higher reading: the rise itself

            return temperatureResult(eligibleEntries, ovulationIndex, coverLineValue)
        }

        // Ausnahmeregel 1: 3. Wert über coverLine aber < +0.2°C → 4. Wert prüfen
        if (allAbove && first3[2] > coverLine && !thirdHighEnough && available.length >= 4) {
            if (hasConsecutiveDates(windowEntries.slice(0, 10)) && available[3] > coverLine) {
                const coverLineValue = calculateCoverLine(previousSix)
                const ovulationIndex = i // first higher reading: the rise itself

                return temperatureResult(eligibleEntries, ovulationIndex, coverLineValue)
            }
        }

        // Ausnahmeregel 2: Einer der 3 Werte fällt auf/unter coverLine → ausklammen, 4 Werte nötig
        if (available.length >= 4) {
            const aboveCount = first3.filter(t => t > coverLine).length
            if (aboveCount === 2) {
                // Genau 1 Wert auf/unter coverLine → 4. muss drüber liegen
                const valuesAbove = [...first3.filter(t => t > coverLine), available[3]]
                if (hasConsecutiveDates(windowEntries.slice(0, 10)) && available[3] > coverLine && valuesAbove.some(t => Math.round(t * 100) >= Math.round((coverLine + 0.2) * 100))) {
                    const coverLineValue = calculateCoverLine(previousSix)
                    const ovulationIndex = i // first higher reading: the rise itself

                    return temperatureResult(eligibleEntries, ovulationIndex, coverLineValue)
                }
            }
        }
    }

    return {
        ovulationDate: null,
        coverLineTemp: null,
        phase: 'follicular',
        cycleDay: null,
        source: 'temperature',
        confidence: 'low',
        isConfirmed: false,
        reason: 'Kein bestätigter Temperaturanstieg gefunden',
    }
}

/**
 * Erkennt alle Temperaturanstiege im gesamten Zeitraum (mit Ausnahmeregeln)
 */
export function detectAllOvulations(
    entries: TemperatureInput[]
): OvulationResult[] {
    const sortedEntries = getEligibleTemperatureEntries(entries)
    if (sortedEntries.length < 9) return []

    const temps = sortedEntries.map(e => Number(e.temperature))
    const results: OvulationResult[] = []

    let i = 6
    while (i <= temps.length - 3) {
        const windowEntries = sortedEntries.slice(i - 6, Math.min(i + 4, sortedEntries.length))
        if (!hasConsecutiveDates(windowEntries.slice(0, 9))) {
            i++
            continue
        }

        const previousSix = temps.slice(i - 6, i)
        const coverLine = Math.max(...previousSix)

        const available = temps.slice(i, Math.min(i + 4, temps.length))
        if (available.length < 3) { i++; continue }

        const first3 = available.slice(0, 3)
        const allAbove = first3.every(t => t > coverLine)
        const thirdHighEnough = Math.round(first3[2] * 100) >= Math.round((coverLine + 0.2) * 100)

        let detected = false

        // Standard-Regel
        if (allAbove && thirdHighEnough) {
            detected = true
        }

        // Ausnahmeregel 1: 3. Wert über coverLine aber < +0.2°C → 4. Wert prüfen
        if (!detected && allAbove && first3[2] > coverLine && !thirdHighEnough && available.length >= 4) {
            if (hasConsecutiveDates(windowEntries.slice(0, 10)) && available[3] > coverLine) detected = true
        }

        // Ausnahmeregel 2: 1 Wert auf/unter coverLine → 4 Werte nötig
        if (!detected && available.length >= 4) {
            const aboveCount = first3.filter(t => t > coverLine).length
            if (aboveCount === 2) {
                const valuesAbove = [...first3.filter(t => t > coverLine), available[3]]
                if (hasConsecutiveDates(windowEntries.slice(0, 10)) && available[3] > coverLine && valuesAbove.some(t => Math.round(t * 100) >= Math.round((coverLine + 0.2) * 100))) {
                    detected = true
                }
            }
        }

        if (detected) {
            const coverLineValue = calculateCoverLine(previousSix)
            const ovulationIndex = i // first higher reading: the rise itself

            results.push(temperatureResult(sortedEntries, ovulationIndex, coverLineValue))

            // Mindestens 20 Tage Pause – ein Zyklus ist mind. ~21 Tage
            i += 20
        } else {
            i++
        }
    }

    return results
}

/**
 * Gruppiert Periodendaten in Zyklusstarts (erster Tag nach >3 Tage Pause)
 */
export function getCycleStarts(periodEntries: PeriodInput[]): string[] {
    const sorted = [...periodEntries]
        .filter(p => p.flow_intensity !== 'spotting')
        .map(p => p.date)
        .sort()
    if (sorted.length === 0) return []

    const cycleStarts: string[] = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1])
        const curr = new Date(sorted[i])
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays > 3) {
            cycleStarts.push(sorted[i])
        }
    }
    return cycleStarts
}

export function getCompletedCycleCount(periodEntries: PeriodInput[]): number {
    const cycleStarts = getCycleStarts(periodEntries)
    let completedCycles = 0

    for (let i = 0; i < cycleStarts.length - 1; i++) {
        const diff = daysBetween(cycleStarts[i], cycleStarts[i + 1])
        if (diff >= 21 && diff <= 45) {
            completedCycles++
        }
    }

    return completedCycles
}

export function hasReliablePredictionBaseline(periodEntries: PeriodInput[], minCompletedCycles = 3): boolean {
    return getCompletedCycleCount(periodEntries) >= minCompletedCycles
}

export interface PredictionReadiness {
    ready: boolean
    completedCycleCount: number
    usableTemperatureCount: number
    disturbedTemperatureCount: number
    excludedTemperatureCount: number
    latestEntryAgeDays: number | null
    reasons: string[]
}

export function getPredictionReadiness(
    entries: TemperatureInput[],
    periodEntries: PeriodInput[],
    minCompletedCycles = 3
): PredictionReadiness {
    const completedCycleCount = getCompletedCycleCount(periodEntries)
    const usableTemperatureCount = entries.filter(entry => !entry.disturbed && !entry.exclude_from_analysis).length
    const disturbedTemperatureCount = entries.filter(entry => Boolean(entry.disturbed)).length
    const excludedTemperatureCount = entries.filter(entry => Boolean(entry.exclude_from_analysis)).length
    const latestDate = entries.map(entry => entry.date).sort().at(-1) || null
    const latestEntryAgeDays = latestDate ? daysBetween(latestDate, new Date().toISOString().slice(0, 10)) : null

    const reasons: string[] = []
    if (completedCycleCount < minCompletedCycles) {
        reasons.push(`${minCompletedCycles - completedCycleCount} weitere abgeschlossene Zyklen erfassen`)
    }
    if (usableTemperatureCount < 18) {
        reasons.push('mehr auswertbare Temperaturwerte eintragen')
    }
    if (latestEntryAgeDays === null) {
        reasons.push('erste Temperatur eintragen')
    } else if (latestEntryAgeDays > 3) {
        reasons.push('aktuelle Temperaturwerte ergänzen')
    }
    if (entries.length > 0 && (disturbedTemperatureCount + excludedTemperatureCount) / entries.length > 0.35) {
        reasons.push('Störfaktoren reduzieren oder Werte gezielt ausschließen')
    }

    return {
        ready: reasons.length === 0,
        completedCycleCount,
        usableTemperatureCount,
        disturbedTemperatureCount,
        excludedTemperatureCount,
        latestEntryAgeDays,
        reasons,
    }
}

/**
 * Formatiert die Temperatur für die Anzeige
 */
export function formatTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
    if (unit === 'fahrenheit') {
        const fahrenheit = (temp * 9 / 5) + 32
        return `${fahrenheit.toFixed(1)}°F`
    }
    return `${temp.toFixed(2)}°C`
}

/**
 * Berechnet den voraussichtlichen nächsten Periodenbeginn
 */
export function predictNextPeriod(
    lastPeriodStart: string,
    cycleLength: number = 28
): string {
    const date = new Date(lastPeriodStart)
    date.setDate(date.getDate() + cycleLength)
    return date.toISOString().split('T')[0]
}
