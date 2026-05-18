// ios/Basaltemperatur/Services/OvulationCalculator.swift
// Eisprung-Erkennung nach der 3-über-6-Regel

import Foundation

struct OvulationResult {
    let ovulationDate: String?
    let coverLineTemp: Double?
    let phase: CyclePhase
    let source: OvulationSource
    let confidence: OvulationConfidence
    let isConfirmed: Bool
    let reason: String?

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    var ovulationDateObject: Date? {
        guard let date = ovulationDate else { return nil }
        return Self.dateFormatter.date(from: date)
    }
}

struct FertilityWindow {
    let start: String
    let end: String
    let peakStart: String
    let peakEnd: String
}

enum FertilityStatus: String {
    case fertile
    case peak
    case infertile
}

enum CyclePhase: String {
    case follicular
    case ovulation
    case luteal
    case unknown
}

enum OvulationSource: String {
    case temperature
    case prediction
}

enum OvulationConfidence: String {
    case high
    case medium
    case low
}

class OvulationCalculator {
    
    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static func eligibleEntries(_ entries: [TemperatureEntry]) -> [TemperatureEntry] {
        entries
            .filter { !$0.disturbed && !$0.excludeFromAnalysis }
            .sorted { $0.date < $1.date }
    }

    private static func hasConsecutiveDates(_ entries: [TemperatureEntry]) -> Bool {
        guard entries.count > 1 else { return true }
        for i in 1..<entries.count {
            guard let prev = dateFormatter.date(from: entries[i - 1].date),
                  let curr = dateFormatter.date(from: entries[i].date) else { return false }
            let diff = Calendar.current.dateComponents([.day], from: prev, to: curr).day ?? 0
            if diff != 1 { return false }
        }
        return true
    }
    
    /// Erkennt ALLE Eisprünge im gesamten Zeitraum (Sensiplan-Methode mit Ausnahmeregeln)
    ///
    /// Regeln:
    /// - 3 aufeinanderfolgende Werte müssen ÜBER der Hilfslinie (= Maximum der 6 Vorwerte) liegen
    /// - Der 3. Wert muss mindestens 0.2°C über der Hilfslinie liegen
    /// - Ausnahmeregel 1: Ist der 3. Wert < +0.2°C über Hilfslinie → 4. Wert muss über Hilfslinie liegen
    /// - Ausnahmeregel 2: Fällt 1 der 3 Werte auf/unter Hilfslinie → ausgeklammert, 4 Werte nötig
    static func detectAllOvulations(entries: [TemperatureEntry]) -> [OvulationResult] {
        let sorted = eligibleEntries(entries)
        guard sorted.count >= 9 else { return [] }
        
        let temps = sorted.map { $0.temperature }
        var results: [OvulationResult] = []
        
        var i = 6
        while i <= temps.count - 3 {
            let windowEnd = min(i + 4, sorted.count)
            let windowEntries = Array(sorted[(i - 6)..<windowEnd])
            if !hasConsecutiveDates(Array(windowEntries.prefix(9))) {
                i += 1
                continue
            }

            let previousSix = Array(temps[(i-6)..<i])
            let coverLine = previousSix.max() ?? 0 // Hilfslinie = Maximum der 6 Vorwerte
            
            let end = min(i + 4, temps.count)
            let available = Array(temps[i..<end])
            guard available.count >= 3 else { i += 1; continue }
            
            let first3 = Array(available[0..<3])
            let allAbove = first3.allSatisfy { $0 > coverLine }
            let thirdHighEnough = (first3[2] * 100).rounded() >= ((coverLine + 0.2) * 100).rounded()
            
            var detected = false
            
            // Standard-Regel
            if allAbove && thirdHighEnough {
                detected = true
            }
            
            // Ausnahmeregel 1: 3. Wert über coverLine aber < +0.2°C → 4. Wert prüfen
            if !detected && allAbove && first3[2] > coverLine && !thirdHighEnough && available.count >= 4 {
                if hasConsecutiveDates(Array(windowEntries.prefix(10))) && available[3] > coverLine { detected = true }
            }
            
            // Ausnahmeregel 2: 1 Wert auf/unter coverLine → 4 Werte nötig
            if !detected && available.count >= 4 {
                let aboveCount = first3.filter { $0 > coverLine }.count
                if aboveCount == 2 {
                    let valuesAbove = first3.filter { $0 > coverLine } + [available[3]]
                    if hasConsecutiveDates(Array(windowEntries.prefix(10))) && available[3] > coverLine && valuesAbove.contains(where: { ($0 * 100).rounded() >= ((coverLine + 0.2) * 100).rounded() }) {
                        detected = true
                    }
                }
            }
            
            if detected {
                let coverLineValue = calculateCoverLine(temperatures: previousSix)
                let ovulationIndex = i - 1
                
                results.append(OvulationResult(
                    ovulationDate: sorted[ovulationIndex].date,
                    coverLineTemp: coverLineValue,
                    phase: .luteal,
                    source: .temperature,
                    confidence: .high,
                    isConfirmed: true,
                    reason: "Temperaturanstieg nach 3-über-6-Regel bestätigt"
                ))
                
                // Mindestens 20 Tage Pause – ein Zyklus ist mind. ~21 Tage
                i += 20
            } else {
                i += 1
            }
        }
        
        return results
    }
    
    /// Gruppiert Periodendaten in Zyklusstarts (erster Tag nach >3 Tage Pause)
    private static func findCycleStarts(periodEntries: [PeriodEntry]) -> [String] {
        let sorted = periodEntries
            .filter { $0.flowIntensity != .spotting }
            .map { $0.date }
            .sorted()
        guard !sorted.isEmpty else { return [] }
        
        var cycleStarts = [sorted[0]]
        for i in 1..<sorted.count {
            guard let prev = dateFormatter.date(from: sorted[i-1]),
                  let curr = dateFormatter.date(from: sorted[i]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: prev, to: curr).day ?? 0
            if diff > 3 {
                cycleStarts.append(sorted[i])
            }
        }
        return cycleStarts
    }

    static func completedCycleCount(periodEntries: [PeriodEntry]) -> Int {
        let cycleStarts = findCycleStarts(periodEntries: periodEntries)
        guard cycleStarts.count >= 2 else { return 0 }

        var count = 0
        for i in 0..<(cycleStarts.count - 1) {
            guard let start = dateFormatter.date(from: cycleStarts[i]),
                  let end = dateFormatter.date(from: cycleStarts[i + 1]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: start, to: end).day ?? 0
            if diff >= 21 && diff <= 45 {
                count += 1
            }
        }
        return count
    }

    static func hasReliablePredictionBaseline(periodEntries: [PeriodEntry], minCompletedCycles: Int = 3) -> Bool {
        completedCycleCount(periodEntries: periodEntries) >= minCompletedCycles
    }
    
    /// Kombiniert erkannte Eisprünge mit berechneten – max 1 pro Zyklus
    static func combineOvulationsWithPredictions(
        detected: [OvulationResult],
        periodEntries: [PeriodEntry],
        cycleLength: Int = 28
    ) -> [OvulationResult] {
        let cycleStarts = findCycleStarts(periodEntries: periodEntries)
        guard !cycleStarts.isEmpty else { return detected }
        
        // Durchschnittliche Zykluslänge
        var avgCycleLength = Double(cycleLength)
        if cycleStarts.count >= 2 {
            var sumDays = 0.0
            var count = 0.0
            for i in 0..<(cycleStarts.count - 1) {
                guard let start = dateFormatter.date(from: cycleStarts[i]),
                      let end = dateFormatter.date(from: cycleStarts[i+1]) else { continue }
                let diff = Calendar.current.dateComponents([.day], from: start, to: end).day ?? 0
                if diff > 20 && diff < 45 {
                    sumDays += Double(diff)
                    count += 1
                }
            }
            if count > 0 { avgCycleLength = (sumDays / count).rounded() }
        }
        let computedCycleLen = Int(avgCycleLength)
        
        // Pro Zyklus: max 1 erkannter Eisprung, sonst 1 berechneten
        var result: [OvulationResult] = []
        
        for i in 0..<cycleStarts.count {
            guard let cycleStartDate = dateFormatter.date(from: cycleStarts[i]) else { continue }
            let nextCycleStartDate: Date? = (i + 1 < cycleStarts.count) ? dateFormatter.date(from: cycleStarts[i+1]) : nil
            
            // Alle erkannten Eisprünge in diesem Zyklus
            let detectedInCycle = detected.filter { res in
                guard let dDate = res.ovulationDateObject else { return false }
                if let next = nextCycleStartDate {
                    return dDate >= cycleStartDate && dDate < next
                } else {
                    return dDate >= cycleStartDate
                }
            }
            
            if let first = detectedInCycle.first {
                // Nur den ERSTEN erkannten pro Zyklus
                result.append(first)
            } else {
                // Berechneten einfügen
                var predictedDate: Date
                if let nextDate = nextCycleStartDate {
                    predictedDate = Calendar.current.date(byAdding: .day, value: -14, to: nextDate) ?? Date()
                } else {
                    predictedDate = Calendar.current.date(byAdding: .day, value: computedCycleLen - 14, to: cycleStartDate) ?? Date()
                }
                
                result.append(OvulationResult(
                    ovulationDate: dateFormatter.string(from: predictedDate),
                    coverLineTemp: nil,
                    phase: .ovulation,
                    source: .prediction,
                    confidence: nextCycleStartDate == nil ? .low : .medium,
                    isConfirmed: false,
                    reason: nextCycleStartDate == nil ? "Prognose aus durchschnittlicher Zykluslänge" : "Rückrechnung aus nächstem Periodenbeginn"
                ))
            }
        }
        
        return result.sorted { ($0.ovulationDate ?? "") < ($1.ovulationDate ?? "") }
    }
    
    /// Berechnet die Cover-Linie (Hilfslinie) nach Sensiplan:
    /// = der HÖCHSTE Wert der 6 niedrigen Temperaturen vor dem Anstieg
    static func calculateCoverLine(temperatures: [Double]) -> Double? {
        guard temperatures.count >= 6 else { return nil }
        let lastSix = Array(temperatures.suffix(6))
        guard let maxVal = lastSix.max() else { return nil }
        return (maxVal * 100).rounded() / 100
    }
    
    /// Voraussichtlicher nächster Eisprung
    static func predictNextOvulation(lastPeriodStart: String, cycleLength: Int = 28, lutealPhase: Int = 14) -> String? {
        guard let date = dateFormatter.date(from: lastPeriodStart) else { return nil }
        let ovulationDate = Calendar.current.date(byAdding: .day, value: cycleLength - lutealPhase, to: date)
        return ovulationDate.map { dateFormatter.string(from: $0) }
    }
    
    /// Voraussichtliche nächste Periode
    static func predictNextPeriod(lastPeriodStart: String, cycleLength: Int = 28) -> String? {
        guard let date = dateFormatter.date(from: lastPeriodStart) else { return nil }
        let nextPeriod = Calendar.current.date(byAdding: .day, value: cycleLength, to: date)
        return nextPeriod.map { dateFormatter.string(from: $0) }
    }
    
    /// Fruchtbarkeitsfenster berechnen
    static func getFertilityWindow(lastPeriodStart: String, cycleLength: Int = 28, lutealPhase: Int = 14) -> FertilityWindow? {
        guard let periodDate = dateFormatter.date(from: lastPeriodStart) else { return nil }
        let ovulationDay = cycleLength - lutealPhase
        
        guard let fertileStart = Calendar.current.date(byAdding: .day, value: ovulationDay - 5, to: periodDate),
              let fertileEnd = Calendar.current.date(byAdding: .day, value: ovulationDay + 1, to: periodDate),
              let peakStart = Calendar.current.date(byAdding: .day, value: ovulationDay - 1, to: periodDate),
              let peakEnd = Calendar.current.date(byAdding: .day, value: ovulationDay, to: periodDate) else { return nil }
        
        return FertilityWindow(
            start: dateFormatter.string(from: fertileStart),
            end: dateFormatter.string(from: fertileEnd),
            peakStart: dateFormatter.string(from: peakStart),
            peakEnd: dateFormatter.string(from: peakEnd)
        )
    }
    
    /// Fruchtbarkeitsstatus für ein bestimmtes Datum — prüft ALLE Fenster
    static func getFertilityStatus(dateStr: String, windows: [FertilityWindow]) -> FertilityStatus {
        for window in windows {
            if dateStr >= window.peakStart && dateStr <= window.peakEnd { return .peak }
            if dateStr >= window.start && dateStr <= window.end { return .fertile }
        }
        return .infertile
    }
    
    /// Einzelnes Fenster (Rückwärtskompatibilität)
    static func getFertilityStatus(dateStr: String, window: FertilityWindow?) -> FertilityStatus {
        guard let window = window else { return .infertile }
        return getFertilityStatus(dateStr: dateStr, windows: [window])
    }
    
    /// Berechnet Fruchtbarkeitsfenster für aktuelle + zukünftige Zyklen
    /// Wissenschaftliche Basis:
    /// - Lutealphase: konstant ~14 Tage (12-16 Tage Spanne)
    /// - Fruchtbares Fenster: 5 Tage vor Eisprung + Eisprung-Tag (Spermien überleben bis zu 5 Tage)
    /// - Peak-Fertilität: Tag vor Eisprung + Eisprung-Tag (höchste Empfängniswahrscheinlichkeit)
    /// - Zykluslänge: Durchschnitt der beobachteten vergangenen Zyklen
    static func getFutureWindows(lastPeriodStart: String, cycleLength: Int = 28, lutealPhase: Int = 14, numberOfCycles: Int = 8) -> [FertilityWindow] {
        guard let startDate = dateFormatter.date(from: lastPeriodStart) else { return [] }
        
        var windows: [FertilityWindow] = []
        
        for cycle in 0..<numberOfCycles {
            let cycleStartOffset = cycle * cycleLength
            guard let cycleStart = Calendar.current.date(byAdding: .day, value: cycleStartOffset, to: startDate) else { continue }
            
            let ovulationDay = cycleLength - lutealPhase
            
            guard let fertileStart = Calendar.current.date(byAdding: .day, value: ovulationDay - 5, to: cycleStart),
                  let fertileEnd = Calendar.current.date(byAdding: .day, value: ovulationDay + 1, to: cycleStart),
                  let peakStart = Calendar.current.date(byAdding: .day, value: ovulationDay - 1, to: cycleStart),
                  let peakEnd = Calendar.current.date(byAdding: .day, value: ovulationDay, to: cycleStart) else { continue }
            
            windows.append(FertilityWindow(
                start: dateFormatter.string(from: fertileStart),
                end: dateFormatter.string(from: fertileEnd),
                peakStart: dateFormatter.string(from: peakStart),
                peakEnd: dateFormatter.string(from: peakEnd)
            ))
        }
        
        return windows
    }
}
