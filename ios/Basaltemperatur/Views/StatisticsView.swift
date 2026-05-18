// ios/Basaltemperatur/Views/StatisticsView.swift
// Zyklusstatistiken – Durchschnitte, Trends, Historie

import SwiftUI
import Charts

struct StatisticsView: View {
    @EnvironmentObject var supabase: SupabaseService
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Statistiken")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Deine Zyklusdaten auf einen Blick.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)

                    if !viewModel.hasLifetimeAccess {
                        PremiumPaywallView(
                            title: "Statistiken sind Premium",
                            message: "Zyklusanalyse, Trends und Verlaufsauswertung sind im Vollzugang enthalten."
                        )
                        .padding(.horizontal)
                    } else {
                        // Stat Cards
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            StatCard(
                                title: "Ø Zykluslänge",
                                value: "\(viewModel.cycleLength) Tage",
                                icon: "calendar.badge.clock",
                                color: Color("AppPrimary")
                            )
                            
                            StatCard(
                                title: "Ø Temperatur",
                                value: viewModel.averageTemperature.map { String(format: "%.2f°C", $0) } ?? "–",
                                icon: "thermometer.medium",
                                color: Color("AppPrimary")
                            )
                            
                            StatCard(
                                title: "Tracking-Streak",
                                value: viewModel.trackingStreak > 0 ? "\(viewModel.trackingStreak) Tage" : "–",
                                icon: "flame",
                                color: .green
                            )
                            
                            StatCard(
                                title: "Auswertbar",
                                value: "\(usableEntries.count)/\(viewModel.entries.count)",
                                icon: "chart.bar",
                                color: affectedRate > 35 ? .orange : .green
                            )

                            StatCard(
                                title: "Ø Periode",
                                value: "\(viewModel.averagePeriodLength) Tage",
                                icon: "drop",
                                color: Color("AppPrimary")
                            )

                            StatCard(
                                title: "Anstiege",
                                value: "\(confirmedRiseCount)",
                                icon: "arrow.up.right",
                                color: Color("Ovulation")
                            )
                        }
                        .padding(.horizontal)

                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 6) {
                                Image(systemName: predictionReady ? "checkmark.shield" : "exclamationmark.triangle")
                                    .font(.caption)
                                    .foregroundStyle(predictionReady ? .green : .orange)
                                Text("Auswertbarkeit")
                                    .font(.headline)
                            }

                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 10) {
                                QualityMetricView(label: "Zyklen", value: "\(viewModel.completedCycleCount)/3")
                                QualityMetricView(label: "Temperaturwerte", value: "\(usableEntries.count)")
                                QualityMetricView(label: "30-Tage-Abdeckung", value: "\(coverageRate)%")
                                QualityMetricView(label: "Störquote", value: "\(affectedRate)%")
                            }

                            if !predictionReasons.isEmpty {
                                VStack(alignment: .leading, spacing: 6) {
                                    ForEach(predictionReasons, id: \.self) { reason in
                                        Label(reason, systemImage: "smallcircle.filled.circle")
                                            .font(.caption)
                                            .foregroundStyle(.orange)
                                    }
                                }
                            }

                            Text("Die Statistik bewertet nur deine Eingaben. Sie ist keine Diagnose und keine sichere Vorhersage.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                        .padding(.horizontal)
                        
                        // Temperature Range
                        if let minT = viewModel.minTemperature, let maxT = viewModel.maxTemperature, let avgT = viewModel.averageTemperature {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 6) {
                                    Image(systemName: "arrow.up.arrow.down")
                                        .font(.caption)
                                        .foregroundStyle(Color("AppPrimary"))
                                    Text("Temperaturbereich")
                                        .font(.headline)
                                }
                                
                                HStack(spacing: 0) {
                                    TempRangeItem(label: "Minimum", value: String(format: "%.2f°", minT), color: .blue)
                                    TempRangeItem(label: "Durchschnitt", value: String(format: "%.2f°", avgT), color: .primary)
                                    TempRangeItem(label: "Maximum", value: String(format: "%.2f°", maxT), color: Color("AppPrimary"))
                                }
                            }
                            .padding()
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                        }
                        
                        // Cycle Length Chart
                        if cycleDetails.count >= 2 {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 6) {
                                    Image(systemName: "chart.bar")
                                        .font(.caption)
                                        .foregroundStyle(Color("AppPrimary"))
                                    Text("Zykluslängen")
                                        .font(.headline)
                                }
                                
                                let chartDetails = Array(cycleDetails.reversed().dropLast()) // chronological, without ongoing
                                Chart {
                                    ForEach(Array(chartDetails.enumerated()), id: \.offset) { index, cycle in
                                        BarMark(
                                            x: .value("Zyklus", "\(index + 1)"),
                                            y: .value("Tage", cycle.length)
                                        )
                                        .foregroundStyle(
                                            .linearGradient(
                                                colors: [Color("AppPrimary"), Color("AppPrimary").opacity(0.6)],
                                                startPoint: .top,
                                                endPoint: .bottom
                                            )
                                        )
                                        .cornerRadius(6)
                                        .annotation(position: .top) {
                                            Text("\(cycle.length)d")
                                                .font(.caption2)
                                                .foregroundStyle(.secondary)
                                        }
                                    }
                                }
                                .chartYAxis {
                                    AxisMarks(values: .automatic) { value in
                                        AxisGridLine()
                                        AxisValueLabel()
                                    }
                                }
                                .chartXAxis {
                                    AxisMarks { value in
                                        AxisValueLabel()
                                            .font(.system(size: 8))
                                    }
                                }
                                .frame(height: 200)
                            }
                            .padding()
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                        }

                        if cycleLengths.count >= 2 {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 6) {
                                    Image(systemName: "waveform.path.ecg")
                                        .font(.caption)
                                        .foregroundStyle(Color("AppPrimary"))
                                    Text("Zyklus-Stabilität")
                                        .font(.headline)
                                }

                                LazyVGrid(columns: [
                                    GridItem(.flexible()),
                                    GridItem(.flexible())
                                ], spacing: 10) {
                                    QualityMetricView(label: "Schwankung", value: cycleRegularity.map { String(format: "±%.1fd", $0) } ?? "–")
                                    QualityMetricView(label: "Kürzester Zyklus", value: shortestCycle.map { "\($0)d" } ?? "–")
                                    QualityMetricView(label: "Längster Zyklus", value: longestCycle.map { "\($0)d" } ?? "–")
                                    QualityMetricView(label: "Trend", value: cycleTrendText)
                                }

                                Text("Kleinere Schwankungen und regelmäßige Einträge machen Prognosen nachvollziehbarer.")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding()
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                        }
                        
                        // Zyklushistorie
                        if !cycleDetails.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 6) {
                                    Image(systemName: "list.bullet.rectangle")
                                        .font(.caption)
                                        .foregroundStyle(Color("AppPrimary"))
                                    Text("Zyklushistorie")
                                        .font(.headline)
                                }
                                
                                ForEach(Array(cycleDetails.enumerated()), id: \.offset) { index, cycle in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("Zyklus \(cycleDetails.count - index)")
                                                .font(.subheadline.weight(.medium))
                                            Text("\(cycle.startFormatted) – \(cycle.endFormatted)")
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Text("\(cycle.length) Tage")
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(Color("AppPrimary"))
                                    }
                                    .padding(.vertical, 6)
                                    if index < cycleDetails.count - 1 {
                                        Divider()
                                    }
                                }
                            }
                            .padding()
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Statistiken")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await viewModel.loadData(supabase: supabase)
            }
        }
    }
    
    // MARK: - Cycle data
    
    private struct CycleDetail {
        let start: String
        let end: String
        let length: Int
        
        var startFormatted: String { Self.format(start) }
        var endFormatted: String { Self.format(end) }
        
        /// Compact label for chart: "2. Feb – 3. Mär"
        var shortLabel: String {
            "\(Self.shortFormat(start)) – \(Self.shortFormat(end))"
        }
        
        private static func format(_ dateStr: String) -> String {
            let input = DateFormatter()
            input.dateFormat = "yyyy-MM-dd"
            let output = DateFormatter()
            output.dateFormat = "d. MMM yyyy"
            output.locale = Locale(identifier: "de_DE")
            guard let date = input.date(from: dateStr) else { return dateStr }
            return output.string(from: date)
        }
        
        private static func shortFormat(_ dateStr: String) -> String {
            let input = DateFormatter()
            input.dateFormat = "yyyy-MM-dd"
            let output = DateFormatter()
            output.dateFormat = "d. MMM"
            output.locale = Locale(identifier: "de_DE")
            guard let date = input.date(from: dateStr) else { return dateStr }
            return output.string(from: date)
        }
    }
    
    private var cycleDetails: [CycleDetail] {
        let starts = cycleStarts
        guard starts.count >= 2 else { return [] }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        var details: [CycleDetail] = []
        for i in 0..<(starts.count - 1) {
            guard let s = formatter.date(from: starts[i]),
                  let e = formatter.date(from: starts[i+1]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: s, to: e).day ?? 0
            if diff > 0 && diff < 60 {
                // End date = day before next cycle start
                let endDate = Calendar.current.date(byAdding: .day, value: -1, to: e)!
                let endStr = formatter.string(from: endDate)
                details.append(CycleDetail(start: starts[i], end: endStr, length: diff))
            }
        }
        
        // Add current (ongoing) cycle
        if let lastStart = starts.last {
            let today = formatter.string(from: Date())
            if let s = formatter.date(from: lastStart) {
                let diff = Calendar.current.dateComponents([.day], from: s, to: Date()).day ?? 0
                details.append(CycleDetail(start: lastStart, end: today, length: diff + 1))
            }
        }
        
        return details.reversed() // newest first
    }
    
    private var cycleStarts: [String] {
        let periodDates = viewModel.periodEntries
            .filter { $0.flowIntensity != .spotting }
            .map { $0.date }
            .sorted()
        var starts: [String] = []
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        for (i, date) in periodDates.enumerated() {
            if i == 0 {
                starts.append(date)
            } else {
                guard let current = formatter.date(from: date),
                      let previous = formatter.date(from: periodDates[i-1]) else { continue }
                let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day ?? 0
                if diff > 3 { starts.append(date) }
            }
        }
        return starts
    }
    
    // Calculate cycle lengths from period data
    private var cycleLengths: [Int] {
        let starts = cycleStarts
        guard starts.count >= 2 else { return [] }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        var lengths: [Int] = []
        for i in 0..<(starts.count - 1) {
            guard let s = formatter.date(from: starts[i]),
                  let e = formatter.date(from: starts[i+1]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: s, to: e).day ?? 0
            if diff > 0 && diff < 60 { lengths.append(diff) }
        }
        return lengths
    }

    private var usableEntries: [TemperatureEntry] {
        viewModel.entries.filter(\.isUsableForAnalysis)
    }

    private var affectedEntryCount: Int {
        viewModel.entries.filter { $0.disturbed || $0.excludeFromAnalysis }.count
    }

    private var affectedRate: Int {
        guard !viewModel.entries.isEmpty else { return 0 }
        return Int((Double(affectedEntryCount) / Double(viewModel.entries.count) * 100).rounded())
    }

    private var coverageRate: Int {
        let uniqueDates = Set(viewModel.entries.map(\.date))
        var covered = 0
        for offset in 0..<30 {
            guard let date = Calendar.current.date(byAdding: .day, value: -offset, to: Date()) else { continue }
            if uniqueDates.contains(Self.dateString(date)) {
                covered += 1
            }
        }
        return Int((Double(covered) / 30.0 * 100).rounded())
    }

    private var predictionReady: Bool {
        predictionReasons.isEmpty
    }

    private var predictionReasons: [String] {
        var reasons: [String] = []
        if viewModel.completedCycleCount < 3 {
            reasons.append("\(3 - viewModel.completedCycleCount) weitere abgeschlossene Zyklen erfassen")
        }
        if usableEntries.count < 18 {
            reasons.append("mehr auswertbare Temperaturwerte eintragen")
        }
        if latestEntryAgeDays == nil {
            reasons.append("erste Temperatur eintragen")
        } else if let age = latestEntryAgeDays, age > 3 {
            reasons.append("aktuelle Temperaturwerte ergänzen")
        }
        if affectedRate > 35 {
            reasons.append("Störfaktoren reduzieren oder Werte gezielt ausschließen")
        }
        return reasons
    }

    private var latestEntryAgeDays: Int? {
        guard let latest = viewModel.entries.map(\.date).sorted().last,
              let latestDate = Self.inputFormatter.date(from: latest) else { return nil }
        return Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: latestDate), to: Calendar.current.startOfDay(for: Date())).day
    }

    private var confirmedRiseCount: Int {
        viewModel.ovulationResults.filter(\.isConfirmed).count
    }

    private var cycleRegularity: Double? {
        guard cycleLengths.count >= 2 else { return nil }
        let avg = Double(cycleLengths.reduce(0, +)) / Double(cycleLengths.count)
        let variance = cycleLengths.reduce(0.0) { sum, value in
            sum + pow(Double(value) - avg, 2)
        } / Double(cycleLengths.count)
        return sqrt(variance)
    }

    private var shortestCycle: Int? {
        cycleLengths.min()
    }

    private var longestCycle: Int? {
        cycleLengths.max()
    }

    private var cycleTrendText: String {
        let recent = Array(cycleLengths.suffix(3))
        let previous = Array(cycleLengths.dropLast(3).suffix(3))
        guard recent.count == 3, previous.count == 3 else { return "–" }
        let recentAvg = Double(recent.reduce(0, +)) / Double(recent.count)
        let previousAvg = Double(previous.reduce(0, +)) / Double(previous.count)
        let diff = Int((recentAvg - previousAvg).rounded())
        return "\(diff > 0 ? "+" : "")\(diff)d"
    }

    private static let inputFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static func dateString(_ date: Date) -> String {
        inputFormatter.string(from: date)
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundStyle(color)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .lineLimit(1)
            }
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Temperature Range Item

struct TempRangeItem: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }
}

struct QualityMetricView: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
            Text(value)
                .font(.headline.weight(.bold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
