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
    
    // Dynamic Color purely based on temperature input
    var activeColor: Color {
        let tempStr = temperatureText.replacingOccurrences(of: ",", with: ".")
        guard let temp = Double(tempStr) else { return Color("AppPrimary") }
        if temp >= 36.8 {
            return .red // Warm/High phase
        } else if temp < 36.5 {
            return .purple // Cool/Low phase
        }
        return Color("AppPrimary") // Normal
    }
    
    // Haptic Feedback Helper
    private func triggerHaptic(style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
    
    private func triggerSuccessHaptic() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }
    
    private func triggerErrorHaptic() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
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
                        HStack {
                            Label("Basaltemperatur (°C)", systemImage: "thermometer.medium")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)
                            Spacer()
                            // Small badges just like web version
                            if let temp = Double(temperatureText.replacingOccurrences(of: ",", with: ".")), temp >= 36.8 {
                                Text("Hochlage")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(.red)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.red.opacity(0.1), in: Capsule())
                                    .transition(.scale.combined(with: .opacity))
                            } else if let temp = Double(temperatureText.replacingOccurrences(of: ",", with: ".")), temp < 36.5 {
                                Text("Tieflage")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(.purple)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.purple.opacity(0.1), in: Capsule())
                                    .transition(.scale.combined(with: .opacity))
                            }
                        }
                        
                        HStack {
                            TextField("36.45", text: $temperatureText)
                                .keyboardType(.decimalPad)
                                .focused($focusedField, equals: .temperature)
                                .font(.system(size: 36, weight: .bold, design: .rounded))
                                .multilineTextAlignment(.center)
                                .foregroundStyle(activeColor)
                                .frame(maxWidth: .infinity)
                                // Trigger liquid color animation when typing
                                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: temperatureText)
                            
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
                                    .fill(activeColor.opacity(0.04))
                            }
                            // Squish effect on typing
                            .animation(.spring(response: 0.4, dampingFraction: 0.7), value: temperatureText)
                        }
                        .overlay {
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(activeColor.opacity(!temperatureText.isEmpty ? 0.3 : 0), lineWidth: 2)
                                .animation(.spring(response: 0.3), value: temperatureText)
                        }
                    }
                    
                    // Periode
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Periodenblutung", systemImage: "drop.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        
                        Button {
                            triggerHaptic(style: .medium)
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                                hasPeriod.toggle()
                            }
                        } label: {
                            HStack {
                                Image(systemName: hasPeriod ? "drop.fill" : "drop")
                                    .foregroundStyle(hasPeriod ? Color("Period") : .secondary)
                                Text(hasPeriod ? "Periode – Ja" : "Periode – Nein")
                                    .fontWeight(.medium)
                                Spacer()
                                if hasPeriod {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(Color("Period"))
                                        .transition(.scale.combined(with: .opacity))
                                }
                            }
                            .padding()
                            .background {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(.ultraThinMaterial)
                                    if hasPeriod {
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(Color("Period").opacity(0.1))
                                            .shadow(color: Color("Period").opacity(0.1), radius: 5, x: 0, y: 2)
                                    }
                                }
                            }
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(hasPeriod ? Color("Period") : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(SquishButtonStyle()) // Custom pressed style
                        
                        // Stärke
                        if hasPeriod {
                            HStack(spacing: 8) {
                                ForEach(FlowIntensity.allCases, id: \.self) { flow in
                                    Button {
                                        triggerHaptic(style: .light)
                                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                            flowIntensity = flow
                                        }
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
                                            // Add small lift effect if selected
                                            .shadow(color: flowIntensity == flow ? Color("Period").opacity(0.3) : .clear, radius: 4, y: 2)
                                            .scaleEffect(flowIntensity == flow ? 1.05 : 1.0)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .transition(.asymmetric(
                                insertion: .move(edge: .top).combined(with: .opacity).animation(.spring(response: 0.5, dampingFraction: 0.6)),
                                removal: .move(edge: .top).combined(with: .opacity).animation(.spring(response: 0.3, dampingFraction: 0.8))
                            ))
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
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.red)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                            .transition(.scale.combined(with: .opacity))
                    }
                    
                    // Morphing Save Button Container
                    ZStack {
                        Button {
                            guard !temperatureText.isEmpty, !isSaving, !showSuccess else { return }
                            triggerHaptic(style: .medium)
                            Task { await saveEntry() }
                        } label: {
                            ZStack {
                                if showSuccess {
                                    Image(systemName: "checkmark")
                                        .font(.title2.weight(.bold))
                                        .foregroundStyle(.white)
                                        .transition(.scale.combined(with: .opacity))
                                } else if isSaving {
                                    ProgressView()
                                        .tint(.white)
                                        .transition(.scale.combined(with: .opacity))
                                } else {
                                    HStack {
                                        Image(systemName: "checkmark.circle.fill")
                                        Text("Speichern")
                                            .fontWeight(.semibold)
                                    }
                                    .foregroundStyle(.white)
                                    .transition(.opacity)
                                }
                            }
                            // The Morphing width
                            .frame(maxWidth: (isSaving || showSuccess) ? 56 : .infinity)
                            .frame(height: 56)
                            // The Morphing background
                            .background(
                                ZStack {
                                    if showSuccess {
                                        Color.green
                                    } else {
                                        LinearGradient(
                                            colors: [activeColor, activeColor.opacity(0.7)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    }
                                },
                                in: RoundedRectangle(cornerRadius: (isSaving || showSuccess) ? 28 : 16)
                            )
                            .shadow(color: (showSuccess ? Color.green : activeColor).opacity(0.3), radius: 8, y: 4)
                        }
                        .disabled(temperatureText.isEmpty || isSaving || showSuccess)
                        .opacity(temperatureText.isEmpty ? 0.5 : 1)
                        // This makes the transition bouncy and physical
                        .animation(.spring(response: 0.4, dampingFraction: 0.6), value: isSaving)
                        .animation(.spring(response: 0.5, dampingFraction: 0.5), value: showSuccess)
                        .buttonStyle(SquishButtonStyle())
                    }
                    .padding(.top, 8)
                    
                }
                .padding()
                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: hasPeriod)
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
            withAnimation(.spring(response: 0.3)) {
                errorMessage = "Bitte gib eine gültige Temperatur ein (34.00 – 42.00 °C)"
            }
            triggerErrorHaptic()
            return
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        
        withAnimation { isSaving = true }
        
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
            
            triggerSuccessHaptic()
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                isSaving = false
                showSuccess = true
            }
            
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            dismiss()
            
        } catch let error as SupabaseError {
            withAnimation {
                isSaving = false
                errorMessage = error.errorDescription ?? "Fehler beim Speichern."
            }
            triggerErrorHaptic()
        } catch {
            withAnimation {
                isSaving = false
                errorMessage = "Fehler beim Speichern: \(error.localizedDescription)"
            }
            triggerErrorHaptic()
        }
    }
}

// Bouncy squish effect for buttons (adds to the Premium feel)
struct SquishButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}
