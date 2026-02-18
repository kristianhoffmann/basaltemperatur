// ios/Basaltemperatur/Views/EntryView.swift

import SwiftUI

struct EntryView: View {
    @EnvironmentObject var supabase: SupabaseService
    @Environment(\.dismiss) private var dismiss
    
    // Edit mode: pass existing data to pre-fill the form
    private let editDate: Date?
    private let existingTemperature: Double?
    private let existingNotes: String?
    private let existingPeriod: Bool
    private let existingFlowIntensity: FlowIntensity?
    
    @State private var date = Date()
    @State private var temperatureText = ""
    @State private var notes = ""
    @State private var hasPeriod = false
    @State private var flowIntensity: FlowIntensity = .medium
    @State private var isSaving = false
    @State private var showSuccess = false
    @State private var errorMessage: String?
    @FocusState private var focusedField: Field?
    
    var isEditing: Bool { editDate != nil }
    
    enum Field: Hashable {
        case temperature, notes
    }
    
    // New entry (no pre-fill)
    init() {
        self.editDate = nil
        self.existingTemperature = nil
        self.existingNotes = nil
        self.existingPeriod = false
        self.existingFlowIntensity = nil
    }
    
    // Edit existing entry
    init(date: Date, temperature: Double?, notes: String?, hasPeriod: Bool, flowIntensity: FlowIntensity?) {
        self.editDate = date
        self.existingTemperature = temperature
        self.existingNotes = notes
        self.existingPeriod = hasPeriod
        self.existingFlowIntensity = flowIntensity
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {

                VStack(spacing: 24) {
                    // Datum
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Datum", systemImage: "calendar")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        if isEditing {
                            Text(date, format: .dateTime.weekday(.wide).day().month(.wide).year())
                                .font(.headline)
                        } else {
                            DatePicker("Datum", selection: $date, in: ...Date(), displayedComponents: .date)
                                .datePickerStyle(.compact)
                                .labelsHidden()
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // Temperatur
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Basaltemperatur (°C)", systemImage: "thermometer.medium")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        
                        HStack {
                            TextField("36.45", text: $temperatureText)
                                .keyboardType(.decimalPad)
                                .focused($focusedField, equals: .temperature)
                                .font(.system(size: 36, weight: .bold, design: .rounded))
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)
                            
                            Text("°C")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background {
                            ZStack {
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(.ultraThinMaterial)
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(Color("AppPrimary").opacity(0.04))
                            }
                        }
                    }
                    
                    // Periode
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Periodenblutung", systemImage: "drop.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        
                        Button {
                            withAnimation(.spring(response: 0.3)) {
                                hasPeriod.toggle()
                            }
                        } label: {
                            HStack {
                                Image(systemName: hasPeriod ? "drop.fill" : "drop")
                                    .foregroundStyle(hasPeriod ? Color("Period") : .secondary)
                                Text(hasPeriod ? "Periode – Ja" : "Periode – Nein")
                                    .fontWeight(.medium)
                                Spacer()
                            }
                            .padding()
                            .background {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(.ultraThinMaterial)
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(hasPeriod ? Color("Period").opacity(0.1) : Color.clear)
                                }
                            }
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(hasPeriod ? Color("Period") : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(.plain)
                        
                        // Stärke
                        if hasPeriod {
                            HStack(spacing: 8) {
                                ForEach(FlowIntensity.allCases, id: \.self) { flow in
                                    Button {
                                        flowIntensity = flow
                                    } label: {
                                        Text(flow.displayName)
                                            .font(.caption.weight(.medium))
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 10)
                                            .background(
                                                flowIntensity == flow
                                                    ? Color("Period")
                                                    : Color("Period").opacity(0.15),
                                                in: RoundedRectangle(cornerRadius: 12)
                                            )
                                            .foregroundStyle(
                                                flowIntensity == flow ? .white : Color("Period")
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .transition(.move(edge: .top).combined(with: .opacity))
                        }
                    }
                    
                    // Notizen
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Notizen (optional)", systemImage: "note.text")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        
                        TextField("z.B. schlecht geschlafen, krank...", text: $notes, axis: .vertical)
                            .focused($focusedField, equals: .notes)
                            .lineLimit(2...4)
                            .padding()
                            .background {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(.ultraThinMaterial)
                            }
                    }
                    
                    // Fehler
                    if let error = errorMessage {
                        Text(error)
                            .font(.subheadline)
                            .foregroundStyle(.red)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                    }
                    
                    // Erfolg
                    if showSuccess {
                        Label("Gespeichert!", systemImage: "checkmark.circle.fill")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.green)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                            .transition(.scale.combined(with: .opacity))
                    }
                    
                    // Speichern Button
                    Button {
                        Task { await saveEntry() }
                    } label: {
                        HStack {
                            if isSaving {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                            }
                            Text(isSaving ? "Speichern..." : "Speichern")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(
                                colors: [Color("AppPrimary"), Color("AppPrimary").opacity(0.85)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            in: RoundedRectangle(cornerRadius: 16)
                        )
                        .foregroundStyle(.white)
                        .shadow(color: Color("AppPrimary").opacity(0.3), radius: 8, y: 4)
                    }
                    .disabled(temperatureText.isEmpty || isSaving)
                    .opacity(temperatureText.isEmpty ? 0.5 : 1)
                }
                .padding()
            }
            .scrollDismissesKeyboard(.interactively)
            .onTapGesture {
                focusedField = nil
            }
            .navigationTitle(isEditing ? "Eintrag bearbeiten" : "Neuer Eintrag")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if let editDate = editDate {
                    date = editDate
                }
                if let temp = existingTemperature {
                    temperatureText = String(format: "%.2f", temp)
                }
                if let existingNotes = existingNotes {
                    notes = existingNotes
                }
                hasPeriod = existingPeriod
                if let flow = existingFlowIntensity {
                    flowIntensity = flow
                }
            }
            .toolbar {
                if focusedField != nil {
                    ToolbarItemGroup(placement: .navigationBarTrailing) {
                        Button("Fertig") {
                            focusedField = nil
                        }
                        .fontWeight(.semibold)
                    }
                }
            }
        }
    }
    
    private func saveEntry() async {
        errorMessage = nil
        
        let tempStr = temperatureText.replacingOccurrences(of: ",", with: ".")
        guard let temp = Double(tempStr), temp >= 34.0, temp <= 42.0 else {
            errorMessage = "Bitte gib eine gültige Temperatur ein (34.00 – 42.00 °C)"
            return
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        
        isSaving = true
        
        do {
            try await supabase.saveTemperatureEntry(
                date: dateStr,
                temperature: temp,
                notes: notes.isEmpty ? nil : notes
            )
            
            if hasPeriod {
                try await supabase.savePeriodEntry(date: dateStr, flowIntensity: flowIntensity)
            } else {
                try await supabase.deletePeriodEntry(date: dateStr)
            }
            
            withAnimation {
                showSuccess = true
            }
            
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            dismiss()
            
        } catch let error as SupabaseError {
            errorMessage = error.errorDescription ?? "Fehler beim Speichern."
        } catch {
            errorMessage = "Fehler beim Speichern: \(error.localizedDescription)"
        }
        
        isSaving = false
    }
}
