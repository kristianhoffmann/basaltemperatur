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
    
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    
    // MARK: - Filtered data
    
    var filteredEntries: [TemperatureEntry] {
        guard let months = selectedRange.months else { return entries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let startStr = dateFormatter.string(from: startDate)
        return entries.filter { $0.date >= startStr }
    }
    
    var filteredPeriodEntries: [PeriodEntry] {
        guard let months = selectedRange.months else { return periodEntries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let startStr = dateFormatter.string(from: startDate)
        return periodEntries.filter { $0.date >= startStr }
    }
    
    var lastEntry: TemperatureEntry? {
        entries.last
    }
    
    // MARK: - Cycle calculations
    
    var lastPeriodStart: String? {
        findLastPeriodStart()
    }
    
    var cycleDay: Int? {
        guard let lastStart = lastPeriodStart,
              let startDate = dateFormatter.date(from: lastStart) else { return nil }
        return Calendar.current.dateComponents([.day], from: startDate, to: Date()).day.map { $0 + 1 }
    }
    
    var cycleLength: Int {
        // Could come from profile; for now average from data or default 28
        let periodDates = periodEntries.map { $0.date }.sorted()
        var cycleStarts: [String] = []
        for (i, date) in periodDates.enumerated() {
            if i == 0 {
                cycleStarts.append(date)
            } else {
                guard let current = dateFormatter.date(from: date),
                      let previous = dateFormatter.date(from: periodDates[i-1]) else { continue }
                let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
                if diff > 3 { cycleStarts.append(date) }
            }
        }
        guard cycleStarts.count >= 2 else { return 28 }
        var lengths: [Int] = []
        for i in 0..<(cycleStarts.count - 1) {
            guard let s = dateFormatter.date(from: cycleStarts[i]),
                  let e = dateFormatter.date(from: cycleStarts[i+1]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: s, to: e).day ?? 0
            if diff > 20 && diff < 40 { lengths.append(diff) }
        }
        guard !lengths.isEmpty else { return 28 }
        return Int((Double(lengths.reduce(0, +)) / Double(lengths.count)).rounded())
    }
    
    // MARK: - Predictions
    
    var nextPeriodDate: String? {
        guard let lastStart = lastPeriodStart else { return nil }
        return OvulationCalculator.predictNextPeriod(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }
    
    var daysUntilPeriod: Int? {
        guard let next = nextPeriodDate, let nextDate = dateFormatter.date(from: next) else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let target = Calendar.current.startOfDay(for: nextDate)
        let diff = Calendar.current.dateComponents([.day], from: today, to: target).day ?? 0
        return diff > 0 ? diff : nil
    }
    
    var nextOvulationDate: String? {
        guard let lastStart = lastPeriodStart else { return nil }
        return OvulationCalculator.predictNextOvulation(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }
    
    var daysUntilOvulation: Int? {
        guard let next = nextOvulationDate, let nextDate = dateFormatter.date(from: next) else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let target = Calendar.current.startOfDay(for: nextDate)
        let diff = Calendar.current.dateComponents([.day], from: today, to: target).day ?? 0
        return diff > 0 ? diff : nil
    }
    
    // MARK: - Fertility
    
    var fertilityWindow: FertilityWindow? {
        guard let lastStart = lastPeriodStart else { return nil }
        return OvulationCalculator.getFertilityWindow(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }
    
    /// Alle Fruchtbarkeitsfenster – aktuell + bis 8 Zyklen in die Zukunft
    var fertilityWindows: [FertilityWindow] {
        guard let lastStart = lastPeriodStart else { return [] }
        return OvulationCalculator.getFutureWindows(lastPeriodStart: lastStart, cycleLength: cycleLength)
    }
    
    var fertilityStatus: FertilityStatus {
        let today = dateFormatter.string(from: Date())
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
        return ov.phase == .luteal && ov.coverLineTemp != nil
    }
    
    // MARK: - Quick Entry
    
    var todayHasEntry: Bool {
        let today = dateFormatter.string(from: Date())
        return entries.contains { $0.date == today }
    }
    
    var lastEntryFormattedDate: String? {
        guard let last = lastEntry, let date = dateFormatter.date(from: last.date) else { return nil }
        let display = DateFormatter()
        display.dateFormat = "d. MMM"
        display.locale = Locale(identifier: "de_DE")
        return display.string(from: date)
    }
    
    // MARK: - Statistics
    
    var averageTemperature: Double? {
        guard !entries.isEmpty else { return nil }
        return entries.map { $0.temperature }.reduce(0, +) / Double(entries.count)
    }
    
    var minTemperature: Double? {
        entries.map { $0.temperature }.min()
    }
    
    var maxTemperature: Double? {
        entries.map { $0.temperature }.max()
    }
    
    var trackingStreak: Int {
        let sorted = entries.map { $0.date }.sorted().reversed()
        guard let first = sorted.first else { return 0 }
        let today = dateFormatter.string(from: Date())
        let yesterday = dateFormatter.string(from: Calendar.current.date(byAdding: .day, value: -1, to: Date())!)
        guard first == today || first == yesterday else { return 0 }
        
        var streak = 1
        let arr = Array(sorted)
        for i in 1..<arr.count {
            guard let current = dateFormatter.date(from: arr[i-1]),
                  let previous = dateFormatter.date(from: arr[i]) else { break }
            let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
            if diff == 1 { streak += 1 } else { break }
        }
        return streak
    }
    
    // MARK: - Load Data
    
    func loadData(supabase: SupabaseService) async {
        isLoading = true
        do {
            try await fetchData(supabase: supabase)
        } catch {
            // Token might be expired — try refreshing and retry once
            do {
                try await supabase.refreshSession()
                try await fetchData(supabase: supabase)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
        isLoading = false
    }
    
    private func fetchData(supabase: SupabaseService) async throws {
        async let tempEntries = supabase.getTemperatureEntries()
        async let periods = supabase.getPeriodEntries()
        
        entries = try await tempEntries
        periodEntries = try await periods
        let detected = OvulationCalculator.detectAllOvulations(entries: entries)
        ovulationResults = OvulationCalculator.combineOvulationsWithPredictions(
            detected: detected,
            periodEntries: periodEntries
        )
    }
    
    // MARK: - Private
    
    private func findLastPeriodStart() -> String? {
        let dates = periodEntries.map { $0.date }.sorted()
        guard !dates.isEmpty else { return nil }
        
        var start = dates.last!
        for i in stride(from: dates.count - 2, through: 0, by: -1) {
            guard let current = dateFormatter.date(from: dates[i + 1]),
                  let previous = dateFormatter.date(from: dates[i]) else { break }
            let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
            if diff <= 1 {
                start = dates[i]
            } else {
                break
            }
        }
        return start
    }
}
