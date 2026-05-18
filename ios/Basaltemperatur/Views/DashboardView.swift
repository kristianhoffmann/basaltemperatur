// ios/Basaltemperatur/Views/DashboardView.swift

import SwiftUI
import Charts

struct DashboardView: View {
    @EnvironmentObject var supabase: SupabaseService
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Greeting
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Hallo! 👋")
                                .font(.title2)
                                .fontWeight(.bold)
                                .tracking(-0.5)
                            Text(Date(), format: .dateTime.weekday(.wide).day().month(.wide))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        NavigationLink(destination: EntryView()) {
                            Label("Eintrag", systemImage: "plus.circle.fill")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 18)
                                .padding(.vertical, 10)
                                .background(
                                    LinearGradient(
                                        colors: [Color("AppPrimary"), Color("AppPrimary").opacity(0.85)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    in: Capsule()
                                )
                                .shadow(color: Color("AppPrimary").opacity(0.3), radius: 8, y: 4)
                        }
                    }
                    .padding(.horizontal)
                    
                    if viewModel.hasLifetimeAccess {
                        // Fertility Status Banner
                        if !viewModel.predictionBaselineReady {
                            PredictionBaselineCard(completedCycles: viewModel.completedCycleCount)
                        }

                        if viewModel.predictionBaselineReady && viewModel.fertilityStatus != .infertile {
                            FertilityBanner(status: viewModel.fertilityStatus)
                        }
                        
                        // KPI Cards
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            KPICard(
                                title: "Zyklustag",
                                value: viewModel.cycleDay.map { "Tag \($0)" } ?? "–",
                                subtitle: viewModel.cycleDay != nil ? "von ~\(viewModel.cycleLength)" : "Keine Periode markiert",
                                icon: "calendar.badge.clock",
                                color: Color("AppPrimary")
                            )
                            
                            KPICard(
                                title: "Letzte Temp.",
                                value: viewModel.lastEntry?.formattedTemperature ?? "–",
                                subtitle: viewModel.lastEntryFormattedDate ?? "Noch kein Eintrag",
                                icon: "thermometer.medium",
                                color: Color("AppPrimary")
                            )
                            
                            KPICard(
                                title: "Temperaturanstieg",
                                value: {
                                    if viewModel.isOvulationConfirmed {
                                        return "Bestätigt"
                                    } else if viewModel.predictionBaselineReady, let days = viewModel.daysUntilOvulation {
                                        return "~\(days)d"
                                    }
                                    return "–"
                                }(),
                                subtitle: {
                                    if viewModel.isOvulationConfirmed {
                                        return "Temperaturanstieg bestätigt"
                                    } else if viewModel.predictionBaselineReady, let ov = viewModel.currentOvulation, let ovDate = ov.ovulationDate {
                                        let f = DateFormatter()
                                        f.dateFormat = "yyyy-MM-dd"
                                        if let d = f.date(from: ovDate) {
                                            let display = DateFormatter()
                                            display.dateFormat = "d. MMM"
                                            display.locale = Locale(identifier: "de_DE")
                                            return display.string(from: d)
                                        }
                                        return "Voraussichtlich"
                                    } else if viewModel.predictionBaselineReady, let nextOv = viewModel.nextOvulationDate, viewModel.daysUntilOvulation != nil {
                                        let f = DateFormatter()
                                        f.dateFormat = "yyyy-MM-dd"
                                        if let d = f.date(from: nextOv) {
                                            let display = DateFormatter()
                                            display.dateFormat = "d. MMM"
                                            display.locale = Locale(identifier: "de_DE")
                                            return display.string(from: d)
                                        }
                                        return "voraussichtlich"
                                    }
                                    return viewModel.predictionBaselineReady ? "Nicht genug Daten" : "3 Zyklen nötig"
                                }(),
                                icon: "sparkles",
                                color: Color("Ovulation")
                            )
                            
                            KPICard(
                                title: "Nächste Periode",
                                value: viewModel.daysUntilPeriod.map { "~\($0)d" } ?? "–",
                                subtitle: {
                                    if let next = viewModel.nextPeriodDate, viewModel.daysUntilPeriod != nil {
                                        let f = DateFormatter()
                                        f.dateFormat = "yyyy-MM-dd"
                                        if let d = f.date(from: next) {
                                            let display = DateFormatter()
                                            display.dateFormat = "d. MMM"
                                            display.locale = Locale(identifier: "de_DE")
                                            return display.string(from: d)
                                        }
                                    }
                                    return "Nicht genug Daten"
                                }(),
                                icon: "arrow.forward.circle",
                                color: Color("Period")
                            )
                        }
                        .padding(.horizontal)
                        
                        // Temperature Chart
                        if !viewModel.entries.isEmpty {
                            TemperatureChartView(
                                allEntries: viewModel.entries,
                                allPeriodEntries: viewModel.periodEntries,
                                ovulations: viewModel.ovulationResults,
                                selectedRange: $viewModel.selectedRange
                            )
                            .padding(.horizontal)
                        } else {
                            EmptyChartView()
                                .padding(.horizontal)
                        }
                        
                        // Disclaimer
                        Text("Hinweis: Temperaturanstiege werden rückblickend nach der 3-über-6-Regel ausgewertet. Fruchtbare Tage und kommende Ereignisse sind Prognosen aus deinen Eingaben. Diese App dient nicht zur Verhütung und ersetzt keinen ärztlichen Rat.")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                            .padding(.bottom, 20)
                    } else {
                        PremiumPaywallView(
                            title: "Analyse ist im Vollzugang enthalten",
                            message: "Einträge und Kalender sind kostenlos. Prognosen, Statistik und Kurvenanalyse kannst du einmalig für 9,99 € freischalten."
                        )
                        .padding(.horizontal)
                    }
                    
                    // Quick Entry Prompt
                    if !viewModel.todayHasEntry {
                        QuickEntryPrompt()
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await viewModel.loadData(supabase: supabase)
            }
            .task {
                await viewModel.loadData(supabase: supabase)
            }
        }
    }
}

// MARK: - Fertility Banner

struct PredictionBaselineCard: View {
    let completedCycles: Int

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.title2)
                .foregroundStyle(Color("AppPrimary"))
            Text("Prognosen werden noch gesammelt")
                .font(.subheadline.weight(.bold))
            Text("Fruchtbarkeits- und Periodenprognosen erscheinen nach 3 abgeschlossenen Zyklen. Aktuell auswertbar: \(completedCycles).")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .padding(.horizontal)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }
}

struct FertilityBanner: View {
    let status: FertilityStatus
    
    private var accentColor: Color {
        status == .peak ? Color.orange : Color.green
    }
    
    var body: some View {
        VStack(spacing: 6) {
            Text(status == .peak ? "⚡" : "🔥")
                .font(.title)
            Text(status == .peak ? "Peak-Fruchtbarkeit (Prognose)" : "Fruchtbares Fenster (Prognose)")
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundStyle(accentColor)
            Text("Basierend auf Zyklusdaten, nicht temperaturbasiert bestätigt")
                .font(.caption)
                .foregroundStyle(accentColor.opacity(0.8))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .padding(.horizontal)
        .background {
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: [accentColor.opacity(0.08), accentColor.opacity(0.02)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                RoundedRectangle(cornerRadius: 20)
                    .stroke(accentColor.opacity(0.15), lineWidth: 1)
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Quick Entry Prompt

struct QuickEntryPrompt: View {
    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "thermometer.medium")
                .font(.largeTitle)
                .foregroundStyle(Color("AppPrimary").opacity(0.5))
                .symbolEffect(.pulse, options: .repeating)
            Text("Du hast heute noch keine Temperatur eingetragen.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            NavigationLink(destination: EntryView()) {
                Label("Jetzt eintragen", systemImage: "plus.circle.fill")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [Color("AppPrimary"), Color("AppPrimary").opacity(0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        in: RoundedRectangle(cornerRadius: 14)
                    )
                    .shadow(color: Color("AppPrimary").opacity(0.3), radius: 8, y: 4)
            }
        }
        .padding()
        .background {
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color("AppPrimary").opacity(0.03))
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - KPI Card

struct KPICard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundStyle(color)
                    .padding(6)
                    .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                Text(title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)
                    .lineLimit(1)
            }
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .tracking(-0.5)
                .foregroundStyle(.primary)
            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background {
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.06), color.opacity(0.01)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                RoundedRectangle(cornerRadius: 20)
                    .stroke(color.opacity(0.08), lineWidth: 0.5)
            }
        }
    }
}

// MARK: - Temperature Chart

struct TemperatureChartView: View {
    let allEntries: [TemperatureEntry]
    let allPeriodEntries: [PeriodEntry]
    let ovulations: [OvulationResult]
    @Binding var selectedRange: DashboardViewModel.ChartRange
    
    @State private var selectedEntry: TemperatureEntry?
    @State private var zoomScale: CGFloat = 1.0
    @State private var lastZoomScale: CGFloat = 1.0
    @State private var panOffset: TimeInterval = 0
    @State private var lastPanOffset: TimeInterval = 0
    
    /// Filtered entries for the dashboard chart based on selectedRange
    private var entries: [TemperatureEntry] {
        guard let months = selectedRange.months else { return allEntries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let startStr = formatter.string(from: startDate)
        return allEntries.filter { $0.date >= startStr }
    }
    
    private var periodEntries: [PeriodEntry] {
        guard let months = selectedRange.months else { return allPeriodEntries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let startStr = formatter.string(from: startDate)
        return allPeriodEntries.filter { $0.date >= startStr }
    }
    
    private var periodDates: Set<String> {
        Set(periodEntries.map { $0.date })
    }

    private var yDomain: ClosedRange<Double> {
        temperatureChartYDomain(entries: entries, ovulations: ovulations)
    }
    
    /// Visible date range based on zoom level + pan offset
    private var zoomedDateRange: ClosedRange<Date> {
        guard let first = entries.first?.dateObject,
              let last = entries.last?.dateObject else {
            return Date()...Date()
        }
        let totalInterval = last.timeIntervalSince(first)
        let visibleInterval = totalInterval / Double(zoomScale)
        // Apply pan offset (negative = scroll left into past)
        let zoomedEnd = last.addingTimeInterval(panOffset)
        let zoomedStart = zoomedEnd.addingTimeInterval(-visibleInterval)
        // Clamp to data bounds
        let clampedStart = max(zoomedStart, first)
        let clampedEnd = min(max(zoomedEnd, first.addingTimeInterval(visibleInterval)), last)
        return clampedStart...clampedEnd
    }
    
    /// Find the most recent period start before or on a given date
    private func cycleDayFor(date: String) -> Int? {
        let sorted = periodEntries
            .filter { $0.flowIntensity != .spotting }
            .map { $0.date }
            .sorted()
        guard !sorted.isEmpty else { return nil }
        
        // Find cycle starts (first day of each period block)
        var cycleStarts: [String] = []
        for i in 0..<sorted.count {
            if i == 0 { cycleStarts.append(sorted[i]); continue }
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            guard let prev = formatter.date(from: sorted[i-1]),
                  let curr = formatter.date(from: sorted[i]) else { continue }
            let diff = Calendar.current.dateComponents([.day], from: prev, to: curr).day ?? 0
            if diff > 2 { cycleStarts.append(sorted[i]) }
        }
        
        // Find the last cycle start before or on this date
        let relevantStarts = cycleStarts.filter { $0 <= date }
        guard let lastStart = relevantStarts.last else { return nil }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let startDate = formatter.date(from: lastStart),
              let entryDate = formatter.date(from: date) else { return nil }
        let days = Calendar.current.dateComponents([.day], from: startDate, to: entryDate).day ?? 0
        return days + 1
    }
    
    private func formattedDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateStr) else { return dateStr }
        let display = DateFormatter()
        display.locale = Locale(identifier: "de_DE")
        display.dateFormat = "d. MMM yyyy"
        return display.string(from: date)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Temperaturkurve")
                    .font(.headline)
                Spacer()
                
                Button {
                    presentLandscapeChart(entries: allEntries, periodEntries: allPeriodEntries, ovulations: ovulations, cycleDayFor: cycleDayFor, formattedDate: formattedDate)
                } label: {
                    Image(systemName: "arrow.up.left.and.arrow.down.right")
                        .font(.subheadline)
                        .foregroundStyle(Color("AppPrimary"))
                }
                .padding(.trailing, 4)
                
                Picker("Zeitraum", selection: $selectedRange) {
                    ForEach(DashboardViewModel.ChartRange.allCases, id: \.self) { range in
                        Text(range.rawValue).tag(range)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .frame(width: 140)
            }
            
            chartContent(height: 220)
            
            // Legend
            HStack(spacing: 16) {
                LegendItem(color: Color("Period"), label: "Periode")
                if ovulations.contains(where: { $0.isConfirmed }) {
                    LegendItem(color: Color("Ovulation"), label: "Bestätigter Anstieg")
                    LegendItem(color: Color("AccentColor"), label: "Cover-Linie", isDashed: true)
                }
                if ovulations.contains(where: { $0.source == .prediction }) {
                    LegendItem(color: Color("Ovulation").opacity(0.45), label: "Prognose")
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
    
    func chartContent(height: CGFloat, scrollable: Bool = false) -> some View {
        Chart {
            // Period backgrounds
            ForEach(periodEntries, id: \.date) { period in
                RectangleMark(
                    x: .value("Datum", period.dateObject),
                    yStart: .value("Min", yDomain.lowerBound),
                    yEnd: .value("Max", yDomain.upperBound),
                    width: .fixed(20)
                )
                .foregroundStyle(Color("Period").opacity(0.1))
            }
            
            // Cover lines
            ForEach(ovulations, id: \.ovulationDate) { result in
                if result.isConfirmed, let coverLine = result.coverLineTemp {
                    RuleMark(y: .value("Cover", coverLine))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                        .foregroundStyle(Color("AccentColor").opacity(0.6))
                }
            }
            
            // Area
            ForEach(entries, id: \.date) { entry in
                AreaMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(
                    .linearGradient(
                        colors: [Color("AppPrimary").opacity(0.15), Color("AppPrimary").opacity(0.02)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)
            }
            
            // Line
            ForEach(entries, id: \.date) { entry in
                LineMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(Color("AppPrimary"))
                .lineStyle(StrokeStyle(lineWidth: 2))
                .interpolationMethod(.catmullRom)
            }
            
            // Points
            ForEach(entries, id: \.date) { entry in
                let ovulation = ovulations.first { $0.ovulationDate == entry.date }
                let isConfirmed = ovulation?.isConfirmed == true
                let isPrediction = ovulation?.source == .prediction
                PointMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(isConfirmed ? Color("Ovulation") : (isPrediction ? Color("Ovulation").opacity(0.45) : Color("AppPrimary")))
                .symbolSize(isConfirmed ? 100 : (isPrediction ? 70 : 30))
            }
            
            // Selected point highlight
            if let selected = selectedEntry {
                RuleMark(x: .value("Selected", selected.dateObject))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 3]))
                    .foregroundStyle(.secondary.opacity(0.5))
                
                PointMark(
                    x: .value("Datum", selected.dateObject),
                    y: .value("Temperatur", selected.temperature)
                )
                .foregroundStyle(Color("AppPrimary"))
                .symbolSize(150)
            }
        }
        .chartYScale(domain: yDomain)
        .chartXScale(domain: zoomedDateRange)
        .chartYAxis {
            AxisMarks(values: .stride(by: 0.2)) { value in
                AxisGridLine()
                AxisValueLabel {
                    if let temp = value.as(Double.self) {
                        Text(String(format: "%.1f", temp))
                            .font(.caption2)
                    }
                }
            }
        }
        .chartXAxis {
            let visibleDays = max(1, Int(Double(entries.count) / Double(zoomScale)))
            let strideCount = visibleDays > 60 ? 14 : (visibleDays > 30 ? 7 : (visibleDays > 14 ? 3 : 1))
            AxisMarks(values: .stride(by: .day, count: strideCount)) { _ in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.day().month(.defaultDigits), centered: true)
                    .font(.system(size: 9))
            }
        }
        .chartOverlay { proxy in
            GeometryReader { geometry in
                Rectangle()
                    .fill(.clear)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 10)
                            .onChanged { value in
                                if zoomScale > 1.0 {
                                    // Pan mode: translate horizontal drag to time offset
                                    guard let startDate: Date = proxy.value(atX: value.startLocation.x),
                                          let currentDate: Date = proxy.value(atX: value.location.x) else { return }
                                    let timeDelta = startDate.timeIntervalSince(currentDate)
                                    panOffset = lastPanOffset + timeDelta
                                    // Clamp pan offset
                                    if let first = entries.first?.dateObject,
                                       let last = entries.last?.dateObject {
                                        let totalInterval = last.timeIntervalSince(first)
                                        let visibleInterval = totalInterval / Double(zoomScale)
                                        let maxPan: TimeInterval = 0
                                        let minPan = -(totalInterval - visibleInterval)
                                        panOffset = min(maxPan, max(minPan, panOffset))
                                    }
                                } else {
                                    // Tooltip selection when not zoomed
                                    let xPos = value.location.x
                                    guard let date: Date = proxy.value(atX: xPos) else { return }
                                    let closest = entries.min(by: {
                                        abs($0.dateObject.timeIntervalSince(date)) < abs($1.dateObject.timeIntervalSince(date))
                                    })
                                    selectedEntry = closest
                                }
                            }
                            .onEnded { _ in
                                lastPanOffset = panOffset
                            }
                    )
                    .simultaneousGesture(
                        MagnifyGesture()
                            .onChanged { value in
                                let newScale = lastZoomScale * value.magnification
                                zoomScale = min(max(newScale, 1.0), 10.0)
                            }
                            .onEnded { _ in
                                lastZoomScale = zoomScale
                                // Reset pan if zoomed back to 1x
                                if zoomScale <= 1.0 {
                                    panOffset = 0
                                    lastPanOffset = 0
                                }
                            }
                    )
                    .onTapGesture { location in
                        if zoomScale > 1.0 {
                            // Tap to select point when zoomed
                            guard let date: Date = proxy.value(atX: location.x) else {
                                selectedEntry = nil
                                return
                            }
                            let closest = entries.min(by: {
                                abs($0.dateObject.timeIntervalSince(date)) < abs($1.dateObject.timeIntervalSince(date))
                            })
                            selectedEntry = (selectedEntry?.date == closest?.date) ? nil : closest
                        } else {
                            selectedEntry = nil
                        }
                    }
                
                // Tooltip as external overlay — does NOT affect chart layout
                if let selected = selectedEntry,
                   let xPos = proxy.position(forX: selected.dateObject),
                   let yPos = proxy.position(forY: selected.temperature) {
                    let tooltipX = min(max(xPos, 60), geometry.size.width - 60)
                    tooltipView(for: selected)
                        .position(x: tooltipX, y: max(yPos - 50, 40))
                }
            }
        }
        .clipped()
        .frame(height: max(1, height))
        .onChange(of: selectedRange) { _, _ in
            zoomScale = 1.0
            lastZoomScale = 1.0
            panOffset = 0
            lastPanOffset = 0
        }
    }
    
    @ViewBuilder
    func tooltipView(for entry: TemperatureEntry) -> some View {
        let ovulation = ovulations.first { $0.ovulationDate == entry.date }
        let cycleDay = cycleDayFor(date: entry.date)
        
        VStack(spacing: 4) {
            Text(formattedDate(entry.date))
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(String(format: "%.2f°", entry.temperature))
                .font(.subheadline)
                .fontWeight(.bold)
            if let day = cycleDay {
                Text("Zyklustag \(day)")
                    .font(.caption2)
                    .foregroundStyle(Color("AppPrimary"))
            }
            if ovulation?.isConfirmed == true {
                Text("Temperaturanstieg bestätigt")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("Ovulation"))
            } else if ovulation?.source == .prediction {
                Text("Zyklus-Prognose")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("Ovulation").opacity(0.8))
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
        .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
    }
}

// MARK: - Fullscreen Chart (Landscape + Zoom)

struct TemperatureChartFullscreenView: View {
    let entries: [TemperatureEntry]
    let periodEntries: [PeriodEntry]
    let ovulations: [OvulationResult]
    let cycleDayFor: (String) -> Int?
    let formattedDate: (String) -> String
    
    @Environment(\.dismiss) private var dismiss
    @State private var selectedEntry: TemperatureEntry?
    @State private var selectedRange: DashboardViewModel.ChartRange = .threeMonths
    @State private var zoomScale: CGFloat = 1.0
    @State private var lastZoomScale: CGFloat = 1.0
    @State private var panOffset: TimeInterval = 0
    @State private var lastPanOffset: TimeInterval = 0
    
    /// Visible date range based on zoom level + pan offset
    private var zoomedDateRange: ClosedRange<Date> {
        guard let first = filteredEntries.first?.dateObject,
              let last = filteredEntries.last?.dateObject else {
            return Date()...Date()
        }
        let totalInterval = last.timeIntervalSince(first)
        let visibleInterval = totalInterval / Double(zoomScale)
        let zoomedEnd = last.addingTimeInterval(panOffset)
        let zoomedStart = zoomedEnd.addingTimeInterval(-visibleInterval)
        let clampedStart = max(zoomedStart, first)
        let clampedEnd = min(max(zoomedEnd, first.addingTimeInterval(visibleInterval)), last)
        return clampedStart...clampedEnd
    }
    
    var filteredEntries: [TemperatureEntry] {
        guard let months = selectedRange.months else { return entries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let startStr = formatter.string(from: startDate)
        return entries.filter { $0.date >= startStr }
    }
    
    var filteredPeriodEntries: [PeriodEntry] {
        guard let months = selectedRange.months else { return periodEntries }
        let startDate = Calendar.current.date(byAdding: .month, value: -months, to: Date())!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let startStr = formatter.string(from: startDate)
        return periodEntries.filter { $0.date >= startStr }
    }

    private var yDomain: ClosedRange<Double> {
        temperatureChartYDomain(entries: filteredEntries, ovulations: ovulations)
    }
    
    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                VStack(spacing: 0) {
                    // Range picker
                    HStack {
                        Picker("Zeitraum", selection: $selectedRange) {
                            ForEach(DashboardViewModel.ChartRange.allCases, id: \.self) { range in
                                Text(range.rawValue).tag(range)
                            }
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 200)
                        
                        Spacer()
                        
                        // Legend
                        HStack(spacing: 12) {
                            LegendItem(color: Color("Period"), label: "Periode")
                            if ovulations.contains(where: { $0.isConfirmed }) {
                                LegendItem(color: Color("Ovulation"), label: "Bestätigter Anstieg")
                            }
                            if ovulations.contains(where: { $0.source == .prediction }) {
                                LegendItem(color: Color("Ovulation").opacity(0.45), label: "Prognose")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    // Full chart
                    fullscreenChart(height: max(1, geo.size.height - 80))
                        .padding(.horizontal, 8)
                }
            }
            .navigationTitle("Temperaturkurve")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fertig") { dismiss() }
                }
            }
            .onAppear {
                OrientationManager.shared.allowLandscape = true
                DispatchQueue.main.async {
                    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
                    scene.requestGeometryUpdate(.iOS(interfaceOrientations: .landscape))
                    // Must call on the topmost presented VC (our hosting controller), not root
                    var topVC = scene.keyWindow?.rootViewController
                    while let p = topVC?.presentedViewController { topVC = p }
                    topVC?.setNeedsUpdateOfSupportedInterfaceOrientations()
                }
            }
            .onDisappear {
                OrientationManager.shared.allowLandscape = false
                guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
                scene.requestGeometryUpdate(.iOS(interfaceOrientations: .portrait))
                scene.keyWindow?.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
            }
        }
    }
    
    func fullscreenChart(height: CGFloat) -> some View {
        Chart {
            ForEach(filteredPeriodEntries, id: \.date) { period in
                RectangleMark(
                    x: .value("Datum", period.dateObject),
                    yStart: .value("Min", yDomain.lowerBound),
                    yEnd: .value("Max", yDomain.upperBound),
                    width: .fixed(20)
                )
                .foregroundStyle(Color("Period").opacity(0.1))
            }
            
            ForEach(ovulations, id: \.ovulationDate) { result in
                if result.isConfirmed, let coverLine = result.coverLineTemp {
                    RuleMark(y: .value("Cover", coverLine))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                        .foregroundStyle(Color("AccentColor").opacity(0.6))
                }
            }
            
            ForEach(filteredEntries, id: \.date) { entry in
                AreaMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(
                    .linearGradient(
                        colors: [Color("AppPrimary").opacity(0.15), Color("AppPrimary").opacity(0.02)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)
            }
            
            ForEach(filteredEntries, id: \.date) { entry in
                LineMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(Color("AppPrimary"))
                .lineStyle(StrokeStyle(lineWidth: 2.5))
                .interpolationMethod(.catmullRom)
            }
            
            ForEach(filteredEntries, id: \.date) { entry in
                let ovulation = ovulations.first { $0.ovulationDate == entry.date }
                let isConfirmed = ovulation?.isConfirmed == true
                let isPrediction = ovulation?.source == .prediction
                PointMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(isConfirmed ? Color("Ovulation") : (isPrediction ? Color("Ovulation").opacity(0.45) : Color("AppPrimary")))
                .symbolSize(isConfirmed ? 120 : (isPrediction ? 80 : 40))
            }
            
            if let selected = selectedEntry {
                RuleMark(x: .value("Selected", selected.dateObject))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 3]))
                    .foregroundStyle(.secondary.opacity(0.5))
                
                PointMark(
                    x: .value("Datum", selected.dateObject),
                    y: .value("Temperatur", selected.temperature)
                )
                .foregroundStyle(Color("AppPrimary"))
                .symbolSize(180)
            }
        }
        .chartYScale(domain: yDomain)
        .chartXScale(domain: zoomedDateRange)
        .chartYAxis {
            AxisMarks(values: .stride(by: 0.1)) { value in
                AxisGridLine()
                AxisValueLabel {
                    if let temp = value.as(Double.self) {
                        Text(String(format: "%.1f", temp))
                            .font(.caption2)
                    }
                }
            }
        }
        .chartXAxis {
            let visibleDays = max(1, Int(Double(filteredEntries.count) / Double(zoomScale)))
            let strideCount = visibleDays > 180 ? 30 : (visibleDays > 60 ? 14 : (visibleDays > 30 ? 7 : (visibleDays > 14 ? 3 : 1)))
            AxisMarks(values: .stride(by: .day, count: strideCount)) { _ in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.day().month(.defaultDigits), centered: true)
                    .font(.system(size: 9))
            }
        }
        .chartOverlay { proxy in
            GeometryReader { geometry in
                Rectangle()
                    .fill(.clear)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 10)
                            .onChanged { value in
                                if zoomScale > 1.0 {
                                    guard let startDate: Date = proxy.value(atX: value.startLocation.x),
                                          let currentDate: Date = proxy.value(atX: value.location.x) else { return }
                                    let timeDelta = startDate.timeIntervalSince(currentDate)
                                    panOffset = lastPanOffset + timeDelta
                                    if let first = filteredEntries.first?.dateObject,
                                       let last = filteredEntries.last?.dateObject {
                                        let totalInterval = last.timeIntervalSince(first)
                                        let visibleInterval = totalInterval / Double(zoomScale)
                                        let maxPan: TimeInterval = 0
                                        let minPan = -(totalInterval - visibleInterval)
                                        panOffset = min(maxPan, max(minPan, panOffset))
                                    }
                                } else {
                                    let xPos = value.location.x
                                    guard let date: Date = proxy.value(atX: xPos) else { return }
                                    let closest = filteredEntries.min(by: {
                                        abs($0.dateObject.timeIntervalSince(date)) < abs($1.dateObject.timeIntervalSince(date))
                                    })
                                    selectedEntry = closest
                                }
                            }
                            .onEnded { _ in
                                lastPanOffset = panOffset
                            }
                    )
                    .simultaneousGesture(
                        MagnifyGesture()
                            .onChanged { value in
                                let newScale = lastZoomScale * value.magnification
                                zoomScale = min(max(newScale, 1.0), 10.0)
                            }
                            .onEnded { _ in
                                lastZoomScale = zoomScale
                                if zoomScale <= 1.0 {
                                    panOffset = 0
                                    lastPanOffset = 0
                                }
                            }
                    )
                    .onTapGesture { location in
                        if zoomScale > 1.0 {
                            guard let date: Date = proxy.value(atX: location.x) else {
                                selectedEntry = nil
                                return
                            }
                            let closest = filteredEntries.min(by: {
                                abs($0.dateObject.timeIntervalSince(date)) < abs($1.dateObject.timeIntervalSince(date))
                            })
                            selectedEntry = (selectedEntry?.date == closest?.date) ? nil : closest
                        } else {
                            selectedEntry = nil
                        }
                    }
                
                // Tooltip as external overlay
                if let selected = selectedEntry,
                   let xPos = proxy.position(forX: selected.dateObject),
                   let yPos = proxy.position(forY: selected.temperature) {
                    let tooltipX = min(max(xPos, 70), geometry.size.width - 70)
                    tooltipView(for: selected)
                        .position(x: tooltipX, y: max(yPos - 50, 40))
                }
            }
        }
        .frame(height: max(1, height))
        .onChange(of: selectedRange) { _, _ in
            zoomScale = 1.0
            lastZoomScale = 1.0
            panOffset = 0
            lastPanOffset = 0
        }
    }
    
    @ViewBuilder
    func tooltipView(for entry: TemperatureEntry) -> some View {
        let ovulation = ovulations.first { $0.ovulationDate == entry.date }
        let cycleDay = cycleDayFor(entry.date)
        
        VStack(spacing: 4) {
            Text(formattedDate(entry.date))
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(String(format: "%.2f°", entry.temperature))
                .font(.subheadline)
                .fontWeight(.bold)
            if let day = cycleDay {
                Text("Zyklustag \(day)")
                    .font(.caption2)
                    .foregroundStyle(Color("AppPrimary"))
            }
            if ovulation?.isConfirmed == true {
                Text("Temperaturanstieg bestätigt")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("Ovulation"))
            } else if ovulation?.source == .prediction {
                Text("Zyklus-Prognose")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("Ovulation").opacity(0.8))
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
        .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
    }
}

// MARK: - Landscape Presentation Helper
// Bypasses SwiftUI's fullScreenCover entirely. UIHostingController created by
// fullScreenCover does not reliably allow device rotation in iOS 16+/26 because
// supportedInterfaceOrientations and shouldAutorotate cannot be overridden from
// SwiftUI. We present LandscapeHostingController directly via UIKit instead.

private func presentLandscapeChart(
    entries: [TemperatureEntry],
    periodEntries: [PeriodEntry],
    ovulations: [OvulationResult],
    cycleDayFor: @escaping (String) -> Int?,
    formattedDate: @escaping (String) -> String
) {
    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let window = scene.keyWindow else { return }
    var presenter: UIViewController? = window.rootViewController
    while let p = presenter?.presentedViewController { presenter = p }
    guard let presenter else { return }

    let content = TemperatureChartFullscreenView(
        entries: entries,
        periodEntries: periodEntries,
        ovulations: ovulations,
        cycleDayFor: cycleDayFor,
        formattedDate: formattedDate
    )
    let vc = LandscapeHostingController(rootView: content)
    vc.modalPresentationStyle = .fullScreen
    vc.onDismiss = {
        OrientationManager.shared.allowLandscape = false
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: .portrait))
        scene.keyWindow?.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
    }
    OrientationManager.shared.allowLandscape = true
    presenter.present(vc, animated: true)
}

// MARK: - Legend Item

struct LegendItem: View {
    let color: Color
    let label: String
    var isDashed: Bool = false
    
    var body: some View {
        HStack(spacing: 4) {
            if isDashed {
                Rectangle()
                    .fill(color)
                    .frame(width: 16, height: 2)
            } else {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)
            }
            Text(label)
        }
    }
}

// MARK: - Empty State

struct EmptyChartView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("📊")
                .font(.system(size: 48))
            Text("Noch keine Daten")
                .font(.headline)
            Text("Trage deine erste Basaltemperatur ein.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

private func temperatureChartYDomain(entries: [TemperatureEntry], ovulations: [OvulationResult]) -> ClosedRange<Double> {
    let coverLines = ovulations.compactMap { $0.coverLineTemp }
    let values = entries.map { $0.temperature } + coverLines
    guard let minValue = values.min(), let maxValue = values.max() else {
        return 35.8...37.5
    }

    let lower = floor((minValue - 0.2) * 10) / 10
    let upper = ceil((maxValue + 0.2) * 10) / 10
    return lower...max(upper, lower + 0.6)
}
