// lib/ovulation.ts
// Eisprung-Erkennung nach der Basaltemperatur-Methode (3-über-6-Regel)
//
// Die "3-über-6-Regel" besagt:
// - Der Eisprung wird erkannt, wenn 3 aufeinanderfolgende Temperaturen
//   über den 6 vorhergehenden Werten liegen
// - Mindestens der 3. Wert muss 0.2°C über der höchsten der 6 vorherigen liegen

import { TemperatureEntry } from '@/types/database'

export interface OvulationResult {
    ovulationDate: string | null
    coverLineTemp: number | null
    phase: 'follicular' | 'ovulation' | 'luteal' | 'unknown'
    cycleDay: number | null
}

export interface ChartDataPoint {
    date: string
    temperature: number | null
    isPeriod: boolean
    isOvulation: boolean
    flowIntensity?: 'light' | 'medium' | 'heavy' | 'spotting'
}

/**
 * Berechnet die Cover-Linie (Hilfslinie) nach Sensiplan:
 * = der HÖCHSTE Wert der 6 niedrigen Temperaturen vor dem Anstieg
 */
export function calculateCoverLine(temperatures: number[]): number | null {
    if (temperatures.length < 6) return null
    const lastSix = temperatures.slice(-6)
    return Math.round(Math.max(...lastSix) * 100) / 100
}

/**
 * Erkennt den Eisprung nach der 3-über-6-Regel (Sensiplan-Methode)
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
 * @returns OvulationResult mit Eisprung-Datum und Cover-Linie
 */
export function detectOvulation(
    entries: Pick<TemperatureEntry, 'date' | 'temperature'>[]
): OvulationResult {
    if (entries.length < 9) {
        return {
            ovulationDate: null,
            coverLineTemp: null,
            phase: 'unknown',
            cycleDay: null,
        }
    }

    const temps = entries.map(e => Number(e.temperature))

    // Suche nach dem Temperaturanstieg (3-über-6-Regel mit Ausnahmeregeln)
    for (let i = 6; i <= temps.length - 3; i++) {
        const previousSix = temps.slice(i - 6, i)
        const coverLine = Math.max(...previousSix) // Hilfslinie = Maximum der 6 Vorwerte

        // Prüfe die nachfolgenden Werte (mindestens 3, ggf. 4 bei Ausnahmeregeln)
        const available = temps.slice(i, Math.min(i + 4, temps.length))
        if (available.length < 3) continue

        const first3 = available.slice(0, 3)
        const allAbove = first3.every(t => t > coverLine)
        const thirdHighEnough = first3[2] >= coverLine + 0.2

        if (allAbove && thirdHighEnough) {
            // Standard-Regel: 3 über 6, 3. ≥ coverLine + 0.2°C
            const coverLineValue = calculateCoverLine(previousSix)
            const ovulationIndex = i - 1

            return {
                ovulationDate: entries[ovulationIndex]?.date || null,
                coverLineTemp: coverLineValue,
                phase: 'luteal',
                cycleDay: ovulationIndex + 1,
            }
        }

        // Ausnahmeregel 1: 3. Wert über coverLine aber < +0.2°C → 4. Wert prüfen
        if (allAbove && first3[2] > coverLine && !thirdHighEnough && available.length >= 4) {
            if (available[3] > coverLine) {
                const coverLineValue = calculateCoverLine(previousSix)
                const ovulationIndex = i - 1

                return {
                    ovulationDate: entries[ovulationIndex]?.date || null,
                    coverLineTemp: coverLineValue,
                    phase: 'luteal',
                    cycleDay: ovulationIndex + 1,
                }
            }
        }

        // Ausnahmeregel 2: Einer der 3 Werte fällt auf/unter coverLine → ausklammen, 4 Werte nötig
        if (available.length >= 4) {
            const aboveCount = first3.filter(t => t > coverLine).length
            if (aboveCount === 2) {
                // Genau 1 Wert auf/unter coverLine → 4. muss drüber liegen
                const valuesAbove = [...first3.filter(t => t > coverLine), available[3]]
                if (available[3] > coverLine && valuesAbove.some(t => t >= coverLine + 0.2)) {
                    const coverLineValue = calculateCoverLine(previousSix)
                    const ovulationIndex = i - 1

                    return {
                        ovulationDate: entries[ovulationIndex]?.date || null,
                        coverLineTemp: coverLineValue,
                        phase: 'luteal',
                        cycleDay: ovulationIndex + 1,
                    }
                }
            }
        }
    }

    return {
        ovulationDate: null,
        coverLineTemp: null,
        phase: 'follicular',
        cycleDay: null,
    }
}

/**
 * Erkennt ALLE Eisprünge im gesamten Zeitraum (Sensiplan-Methode mit Ausnahmeregeln)
 */
export function detectAllOvulations(
    entries: Pick<TemperatureEntry, 'date' | 'temperature'>[]
): OvulationResult[] {
    if (entries.length < 9) return []

    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    const temps = sortedEntries.map(e => Number(e.temperature))
    const results: OvulationResult[] = []

    let i = 6
    while (i <= temps.length - 3) {
        const previousSix = temps.slice(i - 6, i)
        const coverLine = Math.max(...previousSix)

        const available = temps.slice(i, Math.min(i + 4, temps.length))
        if (available.length < 3) { i++; continue }

        const first3 = available.slice(0, 3)
        const allAbove = first3.every(t => t > coverLine)
        const thirdHighEnough = first3[2] >= coverLine + 0.2

        let detected = false

        // Standard-Regel
        if (allAbove && thirdHighEnough) {
            detected = true
        }

        // Ausnahmeregel 1: 3. Wert über coverLine aber < +0.2°C → 4. Wert prüfen
        if (!detected && allAbove && first3[2] > coverLine && !thirdHighEnough && available.length >= 4) {
            if (available[3] > coverLine) detected = true
        }

        // Ausnahmeregel 2: 1 Wert auf/unter coverLine → 4 Werte nötig
        if (!detected && available.length >= 4) {
            const aboveCount = first3.filter(t => t > coverLine).length
            if (aboveCount === 2) {
                const valuesAbove = [...first3.filter(t => t > coverLine), available[3]]
                if (available[3] > coverLine && valuesAbove.some(t => t >= coverLine + 0.2)) {
                    detected = true
                }
            }
        }

        if (detected) {
            const coverLineValue = calculateCoverLine(previousSix)
            const ovulationIndex = i - 1

            results.push({
                ovulationDate: sortedEntries[ovulationIndex]?.date || null,
                coverLineTemp: coverLineValue,
                phase: 'luteal',
                cycleDay: ovulationIndex + 1,
            })

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
function findCycleStarts(periodEntries: Pick<import('@/types/database').PeriodEntry, 'date'>[]): string[] {
    const sorted = [...periodEntries].map(p => p.date).sort()
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

/**
 * Kombiniert erkannte Eisprünge mit berechneten (für Zyklen ohne temperaturbasierten Eisprung)
 * Pro Zyklus wird maximal EIN Eisprung angezeigt.
 */
export function combineOvulationsWithPredictions(
    detected: OvulationResult[],
    periodEntries: Pick<import('@/types/database').PeriodEntry, 'date'>[],
    cycleLength: number = 28 // Fallback
): OvulationResult[] {
    const cycleStarts = findCycleStarts(periodEntries)
    if (cycleStarts.length === 0) return detected

    // Berechne durchschnittliche Zykluslänge aus den Zyklusstarts
    let avgCycleLength = cycleLength
    if (cycleStarts.length >= 2) {
        let sumDays = 0
        let count = 0
        for (let i = 0; i < cycleStarts.length - 1; i++) {
            const start = new Date(cycleStarts[i])
            const end = new Date(cycleStarts[i + 1])
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            if (diff > 20 && diff < 45) {
                sumDays += diff
                count++
            }
        }
        if (count > 0) avgCycleLength = Math.round(sumDays / count)
    }

    // Pro Zyklus: max 1 erkannter Eisprung behalten, sonst 1 berechneten einfügen
    const result: OvulationResult[] = []

    for (let i = 0; i < cycleStarts.length; i++) {
        const cycleStart = new Date(cycleStarts[i])
        const nextCycleStart = i + 1 < cycleStarts.length ? new Date(cycleStarts[i + 1]) : null

        // Finde ALLE erkannten Eisprünge in diesem Zyklus
        const detectedInCycle = detected.filter(d => {
            if (!d.ovulationDate) return false
            const dDate = new Date(d.ovulationDate)
            return dDate >= cycleStart && (nextCycleStart ? dDate < nextCycleStart : true)
        })

        if (detectedInCycle.length > 0) {
            // Nimm nur den ERSTEN erkannten Eisprung pro Zyklus
            result.push(detectedInCycle[0])
        } else {
            // Kein erkannter Eisprung → berechne einen
            let predictedDate: Date
            if (nextCycleStart) {
                // Vergangener Zyklus: 14 Tage vor nächstem Zyklusstart
                predictedDate = new Date(nextCycleStart)
                predictedDate.setDate(predictedDate.getDate() - 14)
            } else {
                // Aktueller Zyklus: Start + avgCycleLength - 14
                predictedDate = new Date(cycleStart)
                predictedDate.setDate(predictedDate.getDate() + avgCycleLength - 14)
            }

            result.push({
                ovulationDate: predictedDate.toISOString().split('T')[0],
                coverLineTemp: null,
                phase: 'ovulation',
                cycleDay: Math.floor((predictedDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
            })
        }
    }

    return result.sort((a, b) => (a.ovulationDate || '').localeCompare(b.ovulationDate || ''))
}

/**
 * Bestimmt die aktuelle Zyklusphase basierend auf dem Zyklustag
 */
export function getCyclePhase(
    cycleDay: number,
    ovulationDay: number | null,
    cycleLength: number = 28
): 'menstruation' | 'follicular' | 'ovulation' | 'luteal' {
    if (cycleDay <= 5) return 'menstruation'
    if (ovulationDay) {
        if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) return 'ovulation'
        if (cycleDay > ovulationDay + 1) return 'luteal'
    }
    return 'follicular'
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
 * Berechnet den voraussichtlichen nächsten Eisprung
 */
export function predictNextOvulation(
    lastPeriodStart: string,
    cycleLength: number = 28,
    lutealPhase: number = 14
): string {
    const date = new Date(lastPeriodStart)
    date.setDate(date.getDate() + (cycleLength - lutealPhase))
    return date.toISOString().split('T')[0]
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

/**
 * Berechnet das Fruchtbarkeitsfenster basierend auf Zykluslänge
 * Fruchtbar: Tag (Eisprung - 5) bis Tag (Eisprung + 1)
 * Peak: Tag (Eisprung - 1) bis Tag (Eisprung)
 */
export interface FertilityWindow {
    start: string
    end: string
    peakStart: string
    peakEnd: string
}

export function getFertilityWindow(
    lastPeriodStart: string,
    cycleLength: number = 28,
    lutealPhase: number = 14
): FertilityWindow {
    const periodDate = new Date(lastPeriodStart)
    const ovulationDay = cycleLength - lutealPhase

    const fertileStart = new Date(periodDate)
    fertileStart.setDate(periodDate.getDate() + ovulationDay - 5)

    const fertileEnd = new Date(periodDate)
    fertileEnd.setDate(periodDate.getDate() + ovulationDay + 1)

    const peakStart = new Date(periodDate)
    peakStart.setDate(periodDate.getDate() + ovulationDay - 1)

    const peakEnd = new Date(periodDate)
    peakEnd.setDate(periodDate.getDate() + ovulationDay)

    return {
        start: fertileStart.toISOString().split('T')[0],
        end: fertileEnd.toISOString().split('T')[0],
        peakStart: peakStart.toISOString().split('T')[0],
        peakEnd: peakEnd.toISOString().split('T')[0],
    }
}

/**
 * Bestimmt den Fruchtbarkeitsstatus für ein bestimmtes Datum
 */
export function getFertilityStatus(
    dateStr: string,
    window: FertilityWindow | null
): 'fertile' | 'peak' | 'infertile' {
    if (!window) return 'infertile'
    if (dateStr >= window.peakStart && dateStr <= window.peakEnd) return 'peak'
    if (dateStr >= window.start && dateStr <= window.end) return 'fertile'
    return 'infertile'
}

/**
 * Berechnet Fruchtbarkeitsfenster für aktuelle + zukünftige Zyklen
 * Wissenschaftliche Basis:
 * - Lutealphase: konstant ~14 Tage
 * - Fruchtbares Fenster: 5 Tage vor Eisprung + Eisprung-Tag
 * - Peak-Fertilität: Tag vor Eisprung + Eisprung-Tag
 */
export function getFutureWindows(
    lastPeriodStart: string,
    cycleLength: number = 28,
    lutealPhase: number = 14,
    numberOfCycles: number = 8
): FertilityWindow[] {
    const startDate = new Date(lastPeriodStart)
    const windows: FertilityWindow[] = []

    for (let cycle = 0; cycle < numberOfCycles; cycle++) {
        const cycleStart = new Date(startDate)
        cycleStart.setDate(startDate.getDate() + cycle * cycleLength)

        const ovulationDay = cycleLength - lutealPhase

        const fertileStart = new Date(cycleStart)
        fertileStart.setDate(cycleStart.getDate() + ovulationDay - 5)

        const fertileEnd = new Date(cycleStart)
        fertileEnd.setDate(cycleStart.getDate() + ovulationDay + 1)

        const peakStart = new Date(cycleStart)
        peakStart.setDate(cycleStart.getDate() + ovulationDay - 1)

        const peakEnd = new Date(cycleStart)
        peakEnd.setDate(cycleStart.getDate() + ovulationDay)

        windows.push({
            start: fertileStart.toISOString().split('T')[0],
            end: fertileEnd.toISOString().split('T')[0],
            peakStart: peakStart.toISOString().split('T')[0],
            peakEnd: peakEnd.toISOString().split('T')[0],
        })
    }

    return windows
}

/**
 * Bestimmt den Fruchtbarkeitsstatus für ein Datum gegen mehrere Fenster
 */
export function getFertilityStatusMulti(
    dateStr: string,
    windows: FertilityWindow[]
): 'fertile' | 'peak' | 'infertile' {
    for (const window of windows) {
        if (dateStr >= window.peakStart && dateStr <= window.peakEnd) return 'peak'
        if (dateStr >= window.start && dateStr <= window.end) return 'fertile'
    }
    return 'infertile'
}
