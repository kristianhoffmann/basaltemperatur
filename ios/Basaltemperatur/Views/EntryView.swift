// ios/Basaltemperatur/Views/EntryView.swift

import SwiftUI

struct EntryView: View {
    @EnvironmentObject var supabase: SupabaseService
    @Environment(\.dismiss) private var dismiss

    private let editDate: Date?
    private let existingTemperature: Double?
    private let existingNotes: String?
    private let existingPeriod: Bool
    private let existingFlowIntensity: FlowIntensity?
    private let existingCervicalMucus: CervicalMucusType?
    private let existingMeasurementTime: String?
    private let existingSleepHours: Double?
    private let existingDisturbed: Bool
    private let existingDisturbanceReason: String?
    private let existingExcludeFromAnalysis: Bool

    @State private var date = Date()
    @State private var temperatureText = ""
    @State private var notes = ""
    @State private var cervicalMucus: CervicalMucusType?
    @State private var measurementTime = ""
    @State private var sleepHoursText = ""
    @State private var disturbed = false
    @State private var disturbanceReason = ""
    @State private var excludeFromAnalysis = false
    @State private var hasPeriod = false
    @State private var flowIntensity: FlowIntensity = .medium
    @State private var isSaving = false
    @State private var showSuccess = false
    @State private var errorMessage: String?
    @FocusState private var focusedField: Field?

    var isEditing: Bool { editDate != nil }

    enum Field: Hashable {
        case temperature
        case measurementTime
        case sleepHours
        case disturbanceReason
        case notes
    }

    var activeColor: Color {
        Color("AppPrimary")
    }

    init() {
        self.editDate = nil
        self.existingTemperature = nil
        self.existingNotes = nil
        self.existingPeriod = false
        self.existingFlowIntensity = nil
        self.existingCervicalMucus = nil
        self.existingMeasurementTime = nil
        self.existingSleepHours = nil
        self.existingDisturbed = false
        self.existingDisturbanceReason = nil
        self.existingExcludeFromAnalysis = false
    }

    init(
        date: Date,
        temperature: Double?,
        notes: String?,
        hasPeriod: Bool,
        flowIntensity: FlowIntensity?,
        cervicalMucus: CervicalMucusType? = nil,
        measurementTime: String? = nil,
        sleepHours: Double? = nil,
        disturbed: Bool = false,
        disturbanceReason: String? = nil,
        excludeFromAnalysis: Bool = false
    ) {
        self.editDate = date
        self.existingTemperature = temperature
        self.existingNotes = notes
        self.existingPeriod = hasPeriod
        self.existingFlowIntensity = flowIntensity
        self.existingCervicalMucus = cervicalMucus
        self.existingMeasurementTime = measurementTime
        self.existingSleepHours = sleepHours
        self.existingDisturbed = disturbed
        self.existingDisturbanceReason = disturbanceReason
        self.existingExcludeFromAnalysis = excludeFromAnalysis
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    dateSection
                    temperatureSection
                    measurementQualitySection
                    cervicalMucusSection
                    periodSection
                    notesSection
                    errorSection
                    saveButton
                }
                .padding()
                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: hasPeriod)
                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: disturbed)
            }
            .scrollDismissesKeyboard(.interactively)
            .onTapGesture {
                focusedField = nil
            }
            .navigationTitle(isEditing ? "Eintrag bearbeiten" : "Neuer Eintrag")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear(perform: applyExistingValues)
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

    private var dateSection: some View {
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
    }

    private var temperatureSection: some View {
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
                    .foregroundStyle(activeColor)
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
                        .fill(activeColor.opacity(0.04))
                }
            }
            .overlay {
                RoundedRectangle(cornerRadius: 20)
                    .stroke(activeColor.opacity(!temperatureText.isEmpty ? 0.3 : 0), lineWidth: 2)
            }
        }
    }

    private var measurementQualitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Messqualität", systemImage: "checklist")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Messzeit")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                    TextField("07:00", text: $measurementTime)
                        .keyboardType(.numbersAndPunctuation)
                        .textContentType(.none)
                        .focused($focusedField, equals: .measurementTime)
                        .padding(10)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Schlaf")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                    HStack(spacing: 6) {
                        TextField("7.5", text: $sleepHoursText)
                            .keyboardType(.decimalPad)
                            .focused($focusedField, equals: .sleepHours)
                        Text("h")
                            .foregroundStyle(.secondary)
                    }
                    .padding(10)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                }
            }

            Toggle(isOn: $disturbed) {
                Label("Messung gestört", systemImage: disturbed ? "exclamationmark.triangle.fill" : "exclamationmark.triangle")
                    .font(.subheadline.weight(.medium))
            }
            .tint(Color("AppPrimary"))
            .onChange(of: disturbed) { _, value in
                if value {
                    excludeFromAnalysis = true
                } else {
                    disturbanceReason = ""
                    excludeFromAnalysis = false
                }
            }

            if disturbed {
                TextField("Grund, z.B. krank, Alkohol, wenig Schlaf", text: $disturbanceReason, axis: .vertical)
                    .focused($focusedField, equals: .disturbanceReason)
                    .lineLimit(1...3)
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }

            Toggle(isOn: $excludeFromAnalysis) {
                Label("Nicht für die Auswertung verwenden", systemImage: "chart.line.downtrend.xyaxis")
                    .font(.subheadline.weight(.medium))
            }
            .tint(Color("AppPrimary"))
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var cervicalMucusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Zervixschleim", systemImage: "drop.degreesign")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            Picker("Zervixschleim", selection: $cervicalMucus) {
                Text("Keine Angabe").tag(Optional<CervicalMucusType>.none)
                ForEach(CervicalMucusType.allCases, id: \.self) { type in
                    Text(type.displayName).tag(Optional(type))
                }
            }
            .pickerStyle(.menu)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
        }
    }

    private var periodSection: some View {
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
                    Text(hasPeriod ? "Periode - Ja" : "Periode - Nein")
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
                        }
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(hasPeriod ? Color("Period") : Color.clear, lineWidth: 2)
                )
            }
            .buttonStyle(SquishButtonStyle())

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
    }

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Notizen (optional)", systemImage: "note.text")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            TextField("z.B. Medikamente, Reise, Stress", text: $notes, axis: .vertical)
                .focused($focusedField, equals: .notes)
                .lineLimit(2...4)
                .padding()
                .background {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                }
        }
    }

    @ViewBuilder
    private var errorSection: some View {
        if let error = errorMessage {
            Text(error)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.red)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                .transition(.scale.combined(with: .opacity))
        }
    }

    private var saveButton: some View {
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
                .frame(maxWidth: (isSaving || showSuccess) ? 56 : .infinity)
                .frame(height: 56)
                .background {
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
                    }
                    .clipShape(
                        RoundedRectangle(cornerRadius: (isSaving || showSuccess) ? 28 : 16)
                    )
                }
                .shadow(color: (showSuccess ? Color.green : activeColor).opacity(0.3), radius: 8, y: 4)
            }
            .disabled(temperatureText.isEmpty || isSaving || showSuccess)
            .opacity(temperatureText.isEmpty ? 0.5 : 1)
            .animation(.spring(response: 0.4, dampingFraction: 0.6), value: isSaving)
            .animation(.spring(response: 0.5, dampingFraction: 0.5), value: showSuccess)
            .buttonStyle(SquishButtonStyle())
        }
        .padding(.top, 8)
    }

    private func applyExistingValues() {
        if let editDate = editDate {
            date = editDate
        }
        if let temp = existingTemperature {
            temperatureText = String(format: "%.2f", temp)
        }
        if let existingNotes = existingNotes {
            notes = existingNotes
        }
        cervicalMucus = existingCervicalMucus
        measurementTime = existingMeasurementTime ?? ""
        if let existingSleepHours {
            sleepHoursText = String(format: "%.1f", existingSleepHours)
        }
        disturbed = existingDisturbed
        disturbanceReason = existingDisturbanceReason ?? ""
        excludeFromAnalysis = existingExcludeFromAnalysis
        hasPeriod = existingPeriod
        if let flow = existingFlowIntensity {
            flowIntensity = flow
        }
    }

    private func saveEntry() async {
        errorMessage = nil

        let tempStr = temperatureText.replacingOccurrences(of: ",", with: ".")
        guard let temp = Double(tempStr), temp >= 34.0, temp <= 42.0 else {
            showValidationError("Bitte gib eine gültige Temperatur ein (34.00 - 42.00 °C)")
            return
        }

        let trimmedMeasurementTime = measurementTime.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedMeasurementTime.isEmpty && !isValidMeasurementTime(trimmedMeasurementTime) {
            showValidationError("Bitte gib die Messzeit im Format HH:MM ein.")
            return
        }

        let sleepText = sleepHoursText.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespacesAndNewlines)
        let sleepHours = sleepText.isEmpty ? nil : Double(sleepText)
        if sleepHoursText.isEmpty == false {
            guard let sleepHours, sleepHours >= 0, sleepHours <= 24 else {
                showValidationError("Bitte gib die Schlafdauer zwischen 0 und 24 Stunden ein.")
                return
            }
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)

        withAnimation { isSaving = true }

        do {
            try await supabase.saveTemperatureEntry(
                date: dateStr,
                temperature: temp,
                notes: notes.isEmpty ? nil : notes,
                cervicalMucus: cervicalMucus,
                measurementTime: trimmedMeasurementTime.isEmpty ? nil : trimmedMeasurementTime,
                sleepHours: sleepHours,
                disturbed: disturbed,
                disturbanceReason: disturbanceReason.isEmpty ? nil : disturbanceReason,
                excludeFromAnalysis: excludeFromAnalysis
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

    private func showValidationError(_ message: String) {
        withAnimation(.spring(response: 0.3)) {
            errorMessage = message
        }
        triggerErrorHaptic()
    }

    private func isValidMeasurementTime(_ value: String) -> Bool {
        let pattern = #"^([01]\d|2[0-3]):[0-5]\d$"#
        return value.range(of: pattern, options: .regularExpression) != nil
    }

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
}

struct SquishButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}
