// ios/Basaltemperatur/Views/CalendarTabView.swift
// Kalenderansicht mit Fruchtbarkeitsfenster

import SwiftUI

struct CalendarTabView: View {
    @EnvironmentObject var supabase: SupabaseService
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedDate = Date()
    @State private var showingEntry = false
    
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Calendar
                    CalendarGridView(
                        selectedDate: $selectedDate,
                        entries: viewModel.entries,
                        periodEntries: viewModel.periodEntries,
                        fertilityWindows: viewModel.fertilityWindows
                    )
                    
                    // Zusammenfassung für den gewählten Tag
                    let dateStr = dateFormatter.string(from: selectedDate)
                    let entry = viewModel.entries.first { $0.date == dateStr }
                    let period = viewModel.periodEntries.first { $0.date == dateStr }
                    let dayFertilityStatus = OvulationCalculator.getFertilityStatus(
                        dateStr: dateStr,
                        windows: viewModel.fertilityWindows
                    )
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text(selectedDate, format: .dateTime.weekday(.wide).day().month(.wide))
                            .font(.headline)
                        
                        // Fertility indicator for selected day
                        if dayFertilityStatus != .infertile {
                            HStack(spacing: 6) {
                                Text(dayFertilityStatus == .peak ? "⚡" : "🌱")
                                Text(dayFertilityStatus == .peak ? "Höchste Fruchtbarkeit" : "Fruchtbar")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundStyle(dayFertilityStatus == .peak ? .orange : .green)
                            }
                        }
                        
                        if let entry = entry {
                            HStack {
                                Image(systemName: "thermometer.medium")
                                    .foregroundStyle(Color("AppPrimary"))
                                Text(entry.formattedTemperature)
                                    .fontWeight(.semibold)
                            }
                            
                            if let notes = entry.notes, !notes.isEmpty {
                                Text(notes)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        
                        if let period = period {
                            HStack {
                                Image(systemName: "drop.fill")
                                    .foregroundStyle(Color("Period"))
                                Text("Periode – \(period.flowIntensity.displayName)")
                                    .fontWeight(.medium)
                            }
                        }
                        
                        if entry == nil && period == nil && dayFertilityStatus == .infertile {
                            Text("Kein Eintrag für diesen Tag")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        
                        Button {
                            showingEntry = true
                        } label: {
                            Label(entry != nil ? "Bearbeiten" : "Eintrag hinzufügen", systemImage: entry != nil ? "pencil" : "plus.circle")
                                .font(.subheadline.weight(.medium))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color("AppPrimary").opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                                .foregroundStyle(Color("AppPrimary"))
                        }
                    }
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                    
                    // Legend
                    HStack(spacing: 16) {
                        CalendarLegendItem(color: Color("AppPrimary").opacity(0.15), label: "Temperatur")
                        CalendarLegendItem(color: Color("Period").opacity(0.15), label: "Periode")
                        CalendarLegendItem(color: .green.opacity(0.1), label: "Fruchtbar")
                        CalendarLegendItem(color: .orange.opacity(0.1), label: "Peak ⚡")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
                }
                .padding()
            }
            .navigationTitle("Kalender")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingEntry) {
                let dateStr = dateFormatter.string(from: selectedDate)
                let entry = viewModel.entries.first { $0.date == dateStr }
                let period = viewModel.periodEntries.first { $0.date == dateStr }
                
                if entry != nil || period != nil {
                    EntryView(
                        date: selectedDate,
                        temperature: entry?.temperature,
                        notes: entry?.notes,
                        hasPeriod: period != nil,
                        flowIntensity: period?.flowIntensity
                    )
                    .environmentObject(supabase)
                } else {
                    EntryView()
                        .environmentObject(supabase)
                }
            }
            .task {
                await viewModel.loadData(supabase: supabase)
            }
            .onChange(of: showingEntry) { _, isPresented in
                if !isPresented {
                    Task { await viewModel.loadData(supabase: supabase) }
                }
            }
        }
    }
}

// MARK: - Calendar Grid

struct CalendarGridView: View {
    @Binding var selectedDate: Date
    let entries: [TemperatureEntry]
    let periodEntries: [PeriodEntry]
    let fertilityWindows: [FertilityWindow]
    
    @State private var displayedMonth = Date()
    
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    
    private let weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    
    private var entryDates: Set<String> {
        Set(entries.map { $0.date })
    }
    
    private var periodDates: Set<String> {
        Set(periodEntries.map { $0.date })
    }
    
    private var entryMap: [String: Double] {
        Dictionary(uniqueKeysWithValues: entries.map { ($0.date, $0.temperature) })
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Month navigation
            HStack {
                Button {
                    displayedMonth = Calendar.current.date(byAdding: .month, value: -1, to: displayedMonth)!
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                        .foregroundStyle(.primary)
                }
                
                Spacer()
                
                Text(displayedMonth, format: .dateTime.month(.wide).year())
                    .font(.headline)
                
                Spacer()
                
                Button {
                    displayedMonth = Calendar.current.date(byAdding: .month, value: 1, to: displayedMonth)!
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.title3)
                        .foregroundStyle(.primary)
                }
            }
            .padding(.horizontal, 4)
            
            // Weekday headers
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 4) {
                ForEach(weekDays, id: \.self) { day in
                    Text(day)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                        .frame(height: 20)
                }
            }
            
            // Days grid
            let days = daysInMonth()
            let firstWeekday = firstDayOfMonthWeekday()
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 4) {
                // Empty cells for offset
                ForEach(0..<firstWeekday, id: \.self) { _ in
                    Text("")
                        .frame(height: 44)
                }
                
                ForEach(days, id: \.self) { day in
                    let dateStr = dateFormatter.string(from: day)
                    let hasEntry = entryDates.contains(dateStr)
                    let isPeriod = periodDates.contains(dateStr)
                    let temp = entryMap[dateStr]
                    let isToday = Calendar.current.isDateInToday(day)
                    let isSelected = Calendar.current.isDate(day, inSameDayAs: selectedDate)
                    let dayFertility = OvulationCalculator.getFertilityStatus(dateStr: dateStr, windows: fertilityWindows)
                    
                    Button {
                        selectedDate = day
                    } label: {
                        VStack(spacing: 1) {
                            Text("\(Calendar.current.component(.day, from: day))")
                                .font(.subheadline)
                                .fontWeight(isToday ? .bold : .regular)
                                .foregroundStyle(
                                    isSelected ? .white :
                                    isPeriod ? Color("Period") :
                                    dayFertility == .peak ? .orange :
                                    dayFertility == .fertile ? .green :
                                    .primary
                                )
                            
                            if let temp = temp {
                                Text(String(format: "%.1f", temp))
                                    .font(.system(size: 8))
                                    .foregroundStyle(isSelected ? .white.opacity(0.8) : .secondary)
                            }
                            
                            if isPeriod {
                                Image(systemName: "drop.fill")
                                    .font(.system(size: 6))
                                    .foregroundStyle(isSelected ? .white : Color("Period"))
                            } else if dayFertility == .peak {
                                Text("⚡")
                                    .font(.system(size: 6))
                            } else if dayFertility == .fertile {
                                Text("🌱")
                                    .font(.system(size: 6))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(
                                    isSelected ? Color("AppPrimary") :
                                    isPeriod ? Color("Period").opacity(0.1) :
                                    dayFertility == .peak ? Color.orange.opacity(0.08) :
                                    dayFertility == .fertile ? Color.green.opacity(0.08) :
                                    hasEntry ? Color("AppPrimary").opacity(0.06) :
                                    Color.clear
                                )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(isToday && !isSelected ? Color("AppPrimary") : Color.clear, lineWidth: 2)
                        )
                    }
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
    
    private func daysInMonth() -> [Date] {
        let calendar = Calendar.current
        let range = calendar.range(of: .day, in: .month, for: displayedMonth)!
        let components = calendar.dateComponents([.year, .month], from: displayedMonth)
        return range.compactMap { day in
            calendar.date(from: DateComponents(year: components.year, month: components.month, day: day))
        }
    }
    
    private func firstDayOfMonthWeekday() -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: displayedMonth)
        guard let firstDay = calendar.date(from: components) else { return 0 }
        let weekday = calendar.component(.weekday, from: firstDay)
        // Adjust for Monday start (1=Sun -> offset 6, 2=Mon -> offset 0, etc.)
        return (weekday + 5) % 7
    }
}

// MARK: - Calendar Legend Item

struct CalendarLegendItem: View {
    let color: Color
    let label: String
    
    var body: some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 3)
                .fill(color)
                .frame(width: 12, height: 12)
            Text(label)
        }
    }
}
