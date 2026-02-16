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
                    // Fertility Status Banner
                    if viewModel.fertilityStatus != .infertile {
                        FertilityBanner(status: viewModel.fertilityStatus)
                    }
                    
                    // Greeting
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Hallo! 👋")
                                .font(.title2)
                                .fontWeight(.bold)
                            Text(Date(), format: .dateTime.weekday(.wide).day().month(.wide))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        NavigationLink(destination: EntryView()) {
                            Label("Eintrag", systemImage: "plus.circle.fill")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color("AppPrimary"), in: Capsule())
                        }
                    }
                    .padding(.horizontal)
                    
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
                            title: "Eisprung",
                            value: {
                                if viewModel.isOvulationConfirmed {
                                    return "Erkannt ✓"
                                } else if let days = viewModel.daysUntilOvulation {
                                    return "~\(days)d"
                                }
                                return "–"
                            }(),
                            subtitle: {
                                if viewModel.isOvulationConfirmed {
                                    return "Bestätigt (3-über-6)"
                                } else if let ov = viewModel.currentOvulation, let ovDate = ov.ovulationDate {
                                    let f = DateFormatter()
                                    f.dateFormat = "yyyy-MM-dd"
                                    if let d = f.date(from: ovDate) {
                                        let display = DateFormatter()
                                        display.dateFormat = "d. MMM"
                                        display.locale = Locale(identifier: "de_DE")
                                        return display.string(from: d)
                                    }
                                    return "Voraussichtlich"
                                } else if let nextOv = viewModel.nextOvulationDate, viewModel.daysUntilOvulation != nil {
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
                                return "Nicht genug Daten"
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
                    
                    // Quick Entry Prompt
                    if !viewModel.todayHasEntry {
                        QuickEntryPrompt()
                    }
                    
                    // Disclaimer
                    Text("Hinweis: Die Eisprung-Erkennung und Zyklusberechnungen basieren auf statistischen Methoden (NFP / 3-über-6-Regel) und deinen Eingaben. Es handelt sich um Schätzungen. Diese App dient nicht zur Verhütung und ersetzt keinen ärztlichen Rat.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.bottom, 20)
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

struct FertilityBanner: View {
    let status: FertilityStatus
    
    var body: some View {
        VStack(spacing: 4) {
            Text(status == .peak ? "⚡" : "🔥")
                .font(.title2)
            Text(status == .peak ? "Höchste Fruchtbarkeit" : "Fruchtbares Fenster")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(status == .peak ? Color.orange : Color.green)
            Text(status == .peak ? "Eisprung steht unmittelbar bevor" : "Du befindest dich im fruchtbaren Fenster")
                .font(.caption)
                .foregroundStyle(status == .peak ? Color.orange.opacity(0.8) : Color.green.opacity(0.8))
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(status == .peak
                      ? Color.orange.opacity(0.08)
                      : Color.green.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(status == .peak
                                ? Color.orange.opacity(0.25)
                                : Color.green.opacity(0.25), lineWidth: 1)
                )
        )
        .padding(.horizontal)
    }
}

// MARK: - Quick Entry Prompt

struct QuickEntryPrompt: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "thermometer.medium")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("Du hast heute noch keine Temperatur eingetragen.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            NavigationLink(destination: EntryView()) {
                Label("Jetzt eintragen", systemImage: "plus.circle")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color("AppPrimary"), in: RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
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
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Temperature Chart

struct TemperatureChartView: View {
    let allEntries: [TemperatureEntry]
    let allPeriodEntries: [PeriodEntry]
    let ovulations: [OvulationResult]
    @Binding var selectedRange: DashboardViewModel.ChartRange
    
    @State private var selectedEntry: TemperatureEntry?
    @State private var showFullscreen = false
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
        let sorted = periodEntries.map { $0.date }.sorted()
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
                    showFullscreen = true
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
                if !ovulations.isEmpty {
                    LegendItem(color: Color("Ovulation"), label: "Eisprung")
                    LegendItem(color: Color("AccentColor"), label: "Cover-Linie", isDashed: true)
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .fullScreenCover(isPresented: $showFullscreen) {
            TemperatureChartFullscreenView(
                entries: allEntries,
                periodEntries: allPeriodEntries,
                ovulations: ovulations,
                cycleDayFor: cycleDayFor,
                formattedDate: formattedDate
            )
        }
    }
    
    func chartContent(height: CGFloat, scrollable: Bool = false) -> some View {
        Chart {
            // Period backgrounds
            ForEach(periodEntries, id: \.date) { period in
                RectangleMark(
                    x: .value("Datum", period.dateObject),
                    yStart: .value("Min", 35.8),
                    yEnd: .value("Max", 37.5),
                    width: .fixed(20)
                )
                .foregroundStyle(Color("Period").opacity(0.1))
            }
            
            // Cover lines
            ForEach(ovulations, id: \.ovulationDate) { result in
                if let coverLine = result.coverLineTemp {
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
                let isOvulation = ovulations.contains { $0.ovulationDate == entry.date }
                PointMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(isOvulation ? Color("Ovulation") : Color("AppPrimary"))
                .symbolSize(isOvulation ? 100 : 30)
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
        .chartYScale(domain: 35.8...37.5)
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
        .frame(height: height)
        .onChange(of: selectedRange) { _, _ in
            zoomScale = 1.0
            lastZoomScale = 1.0
            panOffset = 0
            lastPanOffset = 0
        }
    }
    
    @ViewBuilder
    func tooltipView(for entry: TemperatureEntry) -> some View {
        let isOvulation = ovulations.contains { $0.ovulationDate == entry.date }
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
            if isOvulation {
                Text("🥚 Eisprung")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("Ovulation"))
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
                            if !ovulations.isEmpty {
                                LegendItem(color: Color("Ovulation"), label: "Eisprung")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    // Full chart
                    fullscreenChart(height: geo.size.height - 80)
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
            }
            .onDisappear {
                OrientationManager.shared.allowLandscape = false
                // Force back to portrait
                if #available(iOS 16.0, *) {
                    let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
                    windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: .portrait))
                }
            }
        }
    }
    
    func fullscreenChart(height: CGFloat) -> some View {
        Chart {
            ForEach(filteredPeriodEntries, id: \.date) { period in
                RectangleMark(
                    x: .value("Datum", period.dateObject),
                    yStart: .value("Min", 35.8),
                    yEnd: .value("Max", 37.5),
                    width: .fixed(20)
                )
                .foregroundStyle(Color("Period").opacity(0.1))
            }
            
            ForEach(ovulations, id: \.ovulationDate) { result in
                if let coverLine = result.coverLineTemp {
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
                let isOvulation = ovulations.contains { $0.ovulationDate == entry.date }
                PointMark(
                    x: .value("Datum", entry.dateObject),
                    y: .value("Temperatur", entry.temperature)
                )
                .foregroundStyle(isOvulation ? Color("Ovulation") : Color("AppPrimary"))
                .symbolSize(isOvulation ? 120 : 40)
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
        .chartYScale(domain: 35.8...37.5)
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
        .frame(height: height)
        .onChange(of: selectedRange) { _, _ in
            zoomScale = 1.0
            lastZoomScale = 1.0
            panOffset = 0
            lastPanOffset = 0
        }
    }
    
    @ViewBuilder
    func tooltipView(for entry: TemperatureEntry) -> some View {
        let isOvulation = ovulations.contains { $0.ovulationDate == entry.date }
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
            if isOvulation {
                Text("🥚 Eisprung")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color("Ovulation"))
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
        .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
    }
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
