// ios/Basaltemperatur/ViewModels/DashboardViewModel.swift

import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    enum ChartRange: String, CaseIterable {
        case oneMonth = "1M"
        case threeMonths = "3M"
        case sixMonths = "6M"
        case all = "Max"

        var months: Int? {
            switch self {
            case .oneMonth: return 1
            case .threeMonths: return 3
            case .sixMonths: return 6
            case .all: return nil
            }
        }
    }

    @Published var entries: [TemperatureEntry] = []
    @Published var periodEntries: [PeriodEntry] = []
    @Published var selectedRange: ChartRange = .threeMonths
    @Published var ovulationResults: [OvulationResult] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var hasLifetimeAccess = false

    // MARK: - Memoized analytics
    // These are pure functions of `entries`/`periodEntries`. They are computed once per
    // data load (off the main actor) instead of being recomputed on every SwiftUI render.
    private(set) var lastPeriodStart: String?
    private(set) var cycleLength: Int = 28
    private(set) var completedCycleCount: Int = 0
    private(set) var averagePeriodLength: Int = 5
    private(set) var predictedPeriodDates: Set<String> = []
    private(set) var fertilityWindows: [FertilityWindow] = []
    private(set) var trackingStreak: Int = 0

    /// Reused formatters for the main-actor computed properties below (avoids per-render allocation).
    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let germanDayMonth: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "d. MMM"
        f.locale = Locale(identifier: "de_DE")
        return f
    }()

    // MARK: - Filtered data

    var filteredEntries: [TemperatureEntry] {
        guard let months = selectedRange.months else { return entries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let startStr = Self.isoFormatter.string(from: startDate)
        return entries.filter { $0.date >= startStr }
    }

    var filteredPeriodEntries: [PeriodEntry] {
        guard let months = selectedRange.months else { return periodEntries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let startStr = Self.isoFormatter.string(from: startDate)
        return periodEntries.filter { $0.date >= startStr }
    }

    var lastEntry: TemperatureEntry? {
        entries.last
    }

    // MARK: - Cycle calculations

    var cycleDay: Int? {
        guard let lastStart = lastPeriodStart,
              let startDate = Self.isoFormatter.date(from: lastStart) else { return nil }
        return Calendar.current.dateComponents([.day], from: startDate, to: Date()).day.map { $0 + 1 }
    }

    var predictionBaselineReady: Bool {
        completedCycleCount >= 3
    }

    // MARK: - Predictions

    var nextPeriodDate: String? {
        guard predictionBaselineReady, let lastStart = lastPeriodStart else { return nil }
        return OvulationCalculator.predictNextPeriod(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }

    var daysUntilPeriod: Int? {
        guard let next = nextPeriodDate, let nextDate = Self.isoFormatter.date(from: next) else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let target = Calendar.current.startOfDay(for: nextDate)
        let diff = Calendar.current.dateComponents([.day], from: today, to: target).day ?? 0
        return diff > 0 ? diff : nil
    }

    var nextOvulationDate: String? {
        guard predictionBaselineReady, let lastStart = lastPeriodStart else { return nil }
        return OvulationCalculator.predictNextOvulation(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }

    var daysUntilOvulation: Int? {
        guard let next = nextOvulationDate, let nextDate = Self.isoFormatter.date(from: next) else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let target = Calendar.current.startOfDay(for: nextDate)
        let diff = Calendar.current.dateComponents([.day], from: today, to: target).day ?? 0
        return diff > 0 ? diff : nil
    }

    // MARK: - Fertility

    var fertilityWindow: FertilityWindow? {
        guard predictionBaselineReady, let lastStart = lastPeriodStart else { return nil }
        return OvulationCalculator.getFertilityWindow(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }

    var fertilityStatus: FertilityStatus {
        let today = Self.isoFormatter.string(from: Date())
        return OvulationCalculator.getFertilityStatus(dateStr: today, window: fertilityWindow)
    }

    // MARK: - Ovulation

    var currentOvulation: OvulationResult? {
        guard let lastStart = lastPeriodStart,
              let lastOvulation = ovulationResults.last,
              let ovDate = lastOvulation.ovulationDate else { return nil }
        return ovDate >= lastStart ? lastOvulation : nil
    }

    /// Ob der Eisprung temperaturbasiert bestätigt wurde (3-über-6-Regel)
    var isOvulationConfirmed: Bool {
        guard let ov = currentOvulation else { return false }
        return ov.isConfirmed
    }

    // MARK: - Quick Entry

    var todayHasEntry: Bool {
        let today = Self.isoFormatter.string(from: Date())
        return entries.contains { $0.date == today }
    }

    var lastEntryFormattedDate: String? {
        guard let last = lastEntry else { return nil }
        return Self.germanDayMonth.string(from: last.dateObject)
    }

    // MARK: - Statistics

    var averageTemperature: Double? {
        let usableEntries = entries.filter(\.isUsableForAnalysis)
        guard !usableEntries.isEmpty else { return nil }
        return usableEntries.map { $0.temperature }.reduce(0, +) / Double(usableEntries.count)
    }

    var minTemperature: Double? {
        entries.filter(\.isUsableForAnalysis).map { $0.temperature }.min()
    }

    var maxTemperature: Double? {
        entries.filter(\.isUsableForAnalysis).map { $0.temperature }.max()
    }

    // MARK: - Load Data

    func loadData(supabase: SupabaseService) async {
        isLoading = true

        // Load profile independently so lifetime access is never blocked by data errors
        if let profile = try? await supabase.getUserProfile() {
            hasLifetimeAccess = profile.hasLifetimeAccess
        }

        do {
            try await fetchData(supabase: supabase)
        } catch {
            do {
                try await supabase.refreshSession()
                try await fetchData(supabase: supabase)
            } catch {
                #if DEBUG
                errorMessage = "fetchData failed: \(error)"
                print("Dashboard fetchData error: \(error)")
                #else
                errorMessage = error.localizedDescription
                #endif
            }
        }
        isLoading = false
    }

    private func fetchData(supabase: SupabaseService) async throws {
        async let tempEntries = supabase.getTemperatureEntries(days: 730)
        async let periods = supabase.getPeriodEntries(days: 730)

        let loadedEntries = try await tempEntries
        let loadedPeriods = try await periods

        // Ovulation detection + cycle statistics are O(n) with date parsing; run them off the
        // main actor so a large history never blocks the UI.
        let analytics = await Task.detached {
            Self.buildAnalytics(entries: loadedEntries, periodEntries: loadedPeriods)
        }.value

        // Assign memoized (non-published) values first, then the @Published sources last so the
        // single resulting render already sees consistent derived data.
        lastPeriodStart = analytics.lastPeriodStart
        cycleLength = analytics.cycleLength
        completedCycleCount = analytics.completedCycleCount
        averagePeriodLength = analytics.averagePeriodLength
        predictedPeriodDates = analytics.predictedPeriodDates
        fertilityWindows = analytics.fertilityWindows
        trackingStreak = analytics.trackingStreak

        ovulationResults = analytics.ovulationResults
        entries = loadedEntries
        periodEntries = loadedPeriods
    }

    // MARK: - Pure analytics (nonisolated so they can run off the main actor)

    private struct Analytics: Sendable {
        let ovulationResults: [OvulationResult]
        let lastPeriodStart: String?
        let cycleLength: Int
        let completedCycleCount: Int
        let averagePeriodLength: Int
        let predictedPeriodDates: Set<String>
        let fertilityWindows: [FertilityWindow]
        let trackingStreak: Int
    }

    nonisolated private static func makeISOFormatter() -> DateFormatter {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }

    nonisolated private static func buildAnalytics(
        entries: [TemperatureEntry],
        periodEntries: [PeriodEntry]
    ) -> Analytics {
        let detected = OvulationCalculator.detectAllOvulations(entries: entries)
        let completed = OvulationCalculator.completedCycleCount(periodEntries: periodEntries)
        let baselineReady = completed >= 3
        let ovulations = baselineReady
            ? OvulationCalculator.combineOvulationsWithPredictions(detected: detected, periodEntries: periodEntries)
            : detected

        let lastStart = computeLastPeriodStart(periodEntries: periodEntries)
        let cycleLen = computeCycleLength(periodEntries: periodEntries)
        let avgPeriod = computeAveragePeriodLength(periodEntries: periodEntries)
        let predicted = computePredictedPeriodDates(
            lastPeriodStart: lastStart,
            cycleLength: cycleLen,
            averagePeriodLength: avgPeriod,
            baselineReady: baselineReady
        )

        let windows: [FertilityWindow]
        if baselineReady, let lastStart {
            windows = OvulationCalculator.getFutureWindows(lastPeriodStart: lastStart, cycleLength: cycleLen)
        } else {
            windows = []
        }

        let streak = computeTrackingStreak(entries: entries)

        return Analytics(
            ovulationResults: ovulations,
            lastPeriodStart: lastStart,
            cycleLength: cycleLen,
            completedCycleCount: completed,
            averagePeriodLength: avgPeriod,
            predictedPeriodDates: predicted,
            fertilityWindows: windows,
            trackingStreak: streak
        )
    }

    nonisolated private static func computeLastPeriodStart(periodEntries: [PeriodEntry]) -> String? {
        let f = makeISOFormatter()
        let dates = periodEntries
            .filter { $0.flowIntensity != .spotting }
            .map { $0.date }
            .sorted()
        guard !dates.isEmpty else { return nil }

        var start = dates.last!
        for i in stride(from: dates.count - 2, through: 0, by: -1) {
            guard let current = f.date(from: dates[i + 1]),
                  let previous = f.date(from: dates[i]) else { break }
            let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
            if diff <= 3 {
                start = dates[i]
            } else {
                break
            }
        }
        return start
    }

    nonisolated private static func computeCycleLength(periodEntries: [PeriodEntry]) -> Int {
        let f = makeISOFormatter()
        let periodDates = periodEntries
            .filter { $0.flowIntensity != .spotting }
            .map { $0.date }
            .sorted()
        var cycleStarts: [String] = []
        for (i, date) in periodDates.enumerated() {
            if i == 0 {
                cycleStarts.append(date)
            } else {
                guard let current = f.date(from: date),
                      let previous = f.date(from: periodDates[i - 1]) else { continue }
                let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
                if diff > 3 { cycleStarts.append(date) }
            }
        }
        guard cycleStarts.count >= 2 else { return 28 }
        var lengths: [Int] = []
        for i in 0..<(cycleStarts.count - 1) {
            guard let s = f.date(from: cycleStarts[i]),
                  let e = f.date(from: cycleStarts[i + 1]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: s, to: e).day ?? 0
            if diff > 20 && diff < 40 { lengths.append(diff) }
        }
        guard !lengths.isEmpty else { return 28 }
        return Int((Double(lengths.reduce(0, +)) / Double(lengths.count)).rounded())
    }

    /// Durchschnittliche Blutungsdauer aus vorhandenen Periodenblöcken (Fallback: 5 Tage)
    nonisolated private static func computeAveragePeriodLength(periodEntries: [PeriodEntry]) -> Int {
        let f = makeISOFormatter()
        let sortedDates = periodEntries.map { $0.date }.sorted()
        guard !sortedDates.isEmpty else { return 5 }

        var periodLengths: [Int] = []
        var currentLength = 1

        for i in 1..<sortedDates.count {
            guard let current = f.date(from: sortedDates[i]),
                  let previous = f.date(from: sortedDates[i - 1]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
            if diff <= 1 {
                currentLength += 1
            } else {
                periodLengths.append(currentLength)
                currentLength = 1
            }
        }
        periodLengths.append(currentLength)

        let validLengths = periodLengths.filter { $0 >= 2 && $0 <= 8 }
        guard !validLengths.isEmpty else { return 5 }

        return Int((Double(validLengths.reduce(0, +)) / Double(validLengths.count)).rounded())
    }

    /// Prognostizierte Periodentage für die kommenden Zyklen
    nonisolated private static func computePredictedPeriodDates(
        lastPeriodStart: String?,
        cycleLength: Int,
        averagePeriodLength: Int,
        baselineReady: Bool
    ) -> Set<String> {
        guard baselineReady,
              let lastStart = lastPeriodStart else { return [] }
        let f = makeISOFormatter()
        guard let lastStartDate = f.date(from: lastStart) else { return [] }

        let forecastUntil = Calendar.current.date(byAdding: .day, value: 180, to: Date()) ?? Date()
        var predictedDates: Set<String> = []

        for cycleIndex in 1...8 {
            guard let predictedStart = Calendar.current.date(
                byAdding: .day,
                value: cycleLength * cycleIndex,
                to: lastStartDate
            ) else { continue }

            if predictedStart > forecastUntil { break }

            for offset in 0..<averagePeriodLength {
                guard let day = Calendar.current.date(byAdding: .day, value: offset, to: predictedStart) else { continue }
                predictedDates.insert(f.string(from: day))
            }
        }

        return predictedDates
    }

    nonisolated private static func computeTrackingStreak(entries: [TemperatureEntry]) -> Int {
        let f = makeISOFormatter()
        let sorted = entries.map { $0.date }.sorted().reversed()
        guard let first = sorted.first else { return 0 }
        let today = f.string(from: Date())
        let yesterday = f.string(from: Calendar.current.date(byAdding: .day, value: -1, to: Date())!)
        guard first == today || first == yesterday else { return 0 }

        var streak = 1
        let arr = Array(sorted)
        for i in 1..<arr.count {
            guard let current = f.date(from: arr[i - 1]),
                  let previous = f.date(from: arr[i]) else { break }
            let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
            if diff == 1 { streak += 1 } else { break }
        }
        return streak
    }
}
