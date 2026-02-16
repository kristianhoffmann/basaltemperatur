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
                            title: "Einträge",
                            value: "\(viewModel.entries.count)",
                            icon: "chart.bar",
                            color: Color("AccentColor")
                        )
                    }
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
        let periodDates = viewModel.periodEntries.map { $0.date }.sorted()
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
