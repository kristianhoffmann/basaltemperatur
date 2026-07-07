// ios/Basaltemperatur/Views/SettingsView.swift

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var supabase: SupabaseService
    
    @State private var editingName = false
    @State private var nameText = ""
    @State private var isSavingName = false
    @State private var nameError: String?
    
    @State private var showDeleteAlert = false
    @State private var showConsentRevokeAlert = false
    @State private var deleteConfirmText = ""
    @State private var isDeleting = false
    @State private var isRevokingConsent = false
    @State private var deleteError: String?
    @State private var consentError: String?
    @State private var hasLifetimeAccess = false
    
    @AppStorage("cycleLength") private var cycleLength = 28
    @AppStorage("temperatureUnit") private var temperatureUnit = "celsius"
    @AppStorage("analyticsOptIn") private var analyticsOptIn = false
    
    var body: some View {
        NavigationStack {
            List {
                // Account
                Section {
                    HStack {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [Color("AppPrimary"), Color("AppPrimaryLight")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 48, height: 48)
                                .shadow(color: Color("AppPrimary").opacity(0.3), radius: 6, y: 3)
                            
                            Text("🌡️")
                                .font(.title3)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            if !authViewModel.userName.isEmpty {
                                Text(authViewModel.userName)
                                    .font(.subheadline.weight(.medium))
                                Text(authViewModel.userEmail)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            } else {
                                Text(authViewModel.userEmail)
                                    .font(.subheadline.weight(.medium))
                                Text("Basaltemperatur Konto")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            HStack(spacing: 6) {
                                Text("Bestätigt")
                                    .font(.caption2.weight(.semibold))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.green.opacity(0.15), in: Capsule())
                                    .foregroundStyle(.green)

                                if hasLifetimeAccess {
                                    Label("Lifetime", systemImage: "sparkles")
                                        .font(.caption2.weight(.semibold))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 2)
                                        .background(Color.orange.opacity(0.15), in: Capsule())
                                        .foregroundStyle(.orange)
                                }
                            }
                            .padding(.top, 2)
                        }
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Account")
                }
                
                // Profil bearbeiten
                Section {
                    if editingName {
                        VStack(alignment: .leading) {
                            HStack {
                                TextField("Dein Name", text: $nameText)
                                    .textContentType(.name)
                                    .autocorrectionDisabled()

                                if isSavingName {
                                    ProgressView()
                                        .controlSize(.small)
                                } else {
                                    Button("Sichern") {
                                        Task {
                                            isSavingName = true
                                            nameError = nil
                                            do {
                                                try await authViewModel.updateName(nameText, supabase: supabase)
                                                editingName = false
                                            } catch {
                                                nameError = "Name konnte nicht gespeichert werden."
                                            }
                                            isSavingName = false
                                        }
                                    }
                                    .disabled(nameText.trimmingCharacters(in: .whitespaces).isEmpty)
                                }
                            }
                            if let nameError {
                                Text(nameError)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                        }
                    } else {
                        Button {
                            nameText = authViewModel.userName
                            editingName = true
                        } label: {
                            Label {
                                HStack {
                                    Text("Name ändern")
                                    Spacer()
                                    if !authViewModel.userName.isEmpty {
                                        Text(authViewModel.userName)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            } icon: {
                                Image(systemName: "person.text.rectangle")
                            }
                        }
                    }
                } header: {
                    Text("Profil")
                }
                
                // Einstellungen
                Section {
                    NavigationLink {
                        AppGuideView()
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Anleitung")
                                Text("Schritt-für-Schritt erklärt")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "book.closed")
                        }
                    }

                    NavigationLink {
                        StatisticsView()
                            .environmentObject(supabase)
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Statistiken")
                                Text("Trends und Zyklusverlauf")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "chart.bar")
                        }
                    }

                    NavigationLink {
                        PDFExportView()
                            .environmentObject(supabase)
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("PDF-Export")
                                Text("Zykluskurve für deine Dokumentation")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "doc.richtext")
                        }
                    }
                    
                    NavigationLink {
                        CycleLengthSettingView(cycleLength: $cycleLength)
                    } label: {
                        Label {
                            HStack {
                                Text("Zykluslänge")
                                Spacer()
                                Text("\(cycleLength) Tage")
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "calendar.badge.clock")
                        }
                    }
                    
                    NavigationLink {
                        TemperatureUnitSettingView(temperatureUnit: $temperatureUnit)
                    } label: {
                        Label {
                            HStack {
                                Text("Einheiten")
                                Spacer()
                                Text(temperatureUnit == "celsius" ? "°C" : "°F")
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "thermometer")
                        }
                    }

                    Toggle(isOn: $analyticsOptIn) {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Nutzungsanalyse")
                                Text("Pseudonyme App-Nutzung zur Verbesserung senden")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "chart.line.uptrend.xyaxis")
                        }
                    }
                } header: {
                    Text("Einstellungen")
                }

                
                // Rechtliches
                Section {
                    Link(destination: URL(string: "https://www.basaltemperatur.online/datenschutz")!) {
                        Label("Datenschutz", systemImage: "lock.shield")
                    }
                    Link(destination: URL(string: "https://www.basaltemperatur.online/impressum")!) {
                        Label("Impressum", systemImage: "building.2")
                    }
                    Link(destination: URL(string: "https://www.basaltemperatur.online/agb")!) {
                        Label("AGB", systemImage: "doc.text")
                    }
                    Link(destination: URL(string: "https://www.basaltemperatur.online/widerruf")!) {
                        Label("Widerruf", systemImage: "arrow.uturn.backward.circle")
                    }
                    Link(destination: URL(string: "https://www.basaltemperatur.online/support")!) {
                        Label("Support", systemImage: "envelope")
                    }
                } header: {
                    Text("Rechtliches")
                }
                
                // Abmelden
                Section {
                    Button(role: .destructive) {
                        authViewModel.signOut(supabase: supabase)
                    } label: {
                        Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
                
                // Gefahrenzone
                Section {
                    Button(role: .destructive) {
                        consentError = nil
                        showConsentRevokeAlert = true
                    } label: {
                        Label("Einwilligung widerrufen", systemImage: "arrow.counterclockwise")
                    }

                    Button(role: .destructive) {
                        deleteConfirmText = ""
                        deleteError = nil
                        showDeleteAlert = true
                    } label: {
                        Label("Konto löschen", systemImage: "trash")
                    }
                } header: {
                    Text("Gefahrenzone")
                } footer: {
                    Text("Ein Widerruf pausiert neue Einträge und Auswertungen, löscht aber keine Daten. Das Löschen deines Kontos entfernt alle Daten unwiderruflich.")
                }
            }
            .navigationTitle("Einstellungen")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Einwilligung widerrufen", isPresented: $showConsentRevokeAlert) {
                Button("Abbrechen", role: .cancel) { }
                Button("Widerrufen", role: .destructive) {
                    Task {
                        isRevokingConsent = true
                        do {
                            try await supabase.revokeSensitiveDataConsent()
                        } catch {
                            consentError = error.localizedDescription
                            showConsentRevokeAlert = true
                        }
                        isRevokingConsent = false
                    }
                }
            } message: {
                if let consentError {
                    Text(consentError)
                } else {
                    Text("Neue Temperatur- oder Periodeneinträge und Auswertungen werden blockiert, bis du erneut zustimmst. Vorhandene Daten bleiben erhalten.")
                }
            }
            .alert("Konto löschen", isPresented: $showDeleteAlert) {
                TextField("LÖSCHEN eingeben", text: $deleteConfirmText)
                    .autocorrectionDisabled()
                
                Button("Abbrechen", role: .cancel) { }
                
                Button("Endgültig löschen", role: .destructive) {
                    guard deleteConfirmText == "LÖSCHEN" else {
                        deleteError = "Bitte gib \"LÖSCHEN\" ein um fortzufahren."
                        showDeleteAlert = true
                        return
                    }
                    Task {
                        isDeleting = true
                        do {
                            try await authViewModel.deleteAccount(supabase: supabase)
                        } catch {
                            deleteError = error.localizedDescription
                            showDeleteAlert = true
                        }
                        isDeleting = false
                    }
                }
                .disabled(deleteConfirmText != "LÖSCHEN")
            } message: {
                if let error = deleteError {
                    Text(error)
                } else {
                    Text("Alle Daten werden gelöscht. Gib \"LÖSCHEN\" ein um zu bestätigen.")
                }
            }
            .overlay {
                if isDeleting || isRevokingConsent {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()
                        VStack(spacing: 12) {
                            ProgressView()
                            Text(isDeleting ? "Konto wird gelöscht..." : "Einwilligung wird widerrufen...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(30)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    }
                }
            }
            .task {
                await authViewModel.loadUserMetadata(supabase: supabase)
                if let profile = try? await supabase.getUserProfile() {
                    hasLifetimeAccess = profile.hasLifetimeAccess
                } else {
                    hasLifetimeAccess = false
                }
            }
        }
    }
}

// MARK: - Zykluslänge einstellen

struct CycleLengthSettingView: View {
    @Binding var cycleLength: Int
    
    var body: some View {
        List {
            Section {
                Picker("Zykluslänge", selection: $cycleLength) {
                    ForEach(20...45, id: \.self) { days in
                        Text("\(days) Tage").tag(days)
                    }
                }
                .pickerStyle(.wheel)
                .frame(height: 150)
            } header: {
                Text("Standard-Zykluslänge")
            } footer: {
                Text("Die Zykluslänge wird für Prognosen verwendet, wenn nicht genügend historische Daten vorhanden sind. Standardwert: 28 Tage.")
            }
            
            Section {
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundStyle(Color("AppPrimary"))
                    Text("Die App berechnet deine individuelle Zykluslänge automatisch, sobald mindestens zwei Periodeneinträge vorhanden sind.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Zykluslänge")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Temperatureinheit

struct TemperatureUnitSettingView: View {
    @Binding var temperatureUnit: String
    
    var body: some View {
        List {
            Section {
                HStack {
                    Button {
                        temperatureUnit = "celsius"
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Celsius (°C)")
                                    .font(.body.weight(.medium))
                                Text("Standard in Deutschland")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if temperatureUnit == "celsius" {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Color("AppPrimary"))
                                    .font(.title3)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                .padding(.vertical, 4)
                
                HStack {
                    Button {
                        temperatureUnit = "fahrenheit"
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Fahrenheit (°F)")
                                    .font(.body.weight(.medium))
                                Text("Üblich in den USA")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if temperatureUnit == "fahrenheit" {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Color("AppPrimary"))
                                    .font(.title3)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                .padding(.vertical, 4)
            } header: {
                Text("Temperatureinheit")
            } footer: {
                Text("Die Einheit wird für die Anzeige in der App und im PDF-Export verwendet.")
            }
        }
        .navigationTitle("Einheiten")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AppGuideView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                GuideInfoCard(
                    icon: "sparkles",
                    title: "Schnellstart",
                    text: "Trage täglich deine Temperatur ein, markiere deine Periode und bleib regelmäßig dran. So werden Auswertungen nachvollziehbarer."
                )

                VStack(alignment: .leading, spacing: 10) {
                    Text("So gehst du vor")
                        .font(.headline)

                    GuideStepRow(
                        title: "1. Morgens messen",
                        text: "Direkt nach dem Aufwachen messen, möglichst immer zur gleichen Uhrzeit."
                    )
                    GuideStepRow(
                        title: "2. Eintrag speichern",
                        text: "Temperatur täglich eintragen und gestörte Messungen markieren."
                    )
                    GuideStepRow(
                        title: "3. Periode markieren",
                        text: "Blutungstage im Kalender markieren, damit Zyklusphasen korrekt erkannt werden."
                    )
                    GuideStepRow(
                        title: "4. Verlauf beobachten",
                        text: "Temperaturanstiege werden rückblickend ausgewertet, Prognosen werden mit mehreren Zyklen stabiler."
                    )
                }
                .padding()
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))

                VStack(alignment: .leading, spacing: 10) {
                    Text("Kalender-Legende")
                        .font(.headline)

                    GuideLegendRow(color: Color("Period"), text: "Periode")
                    GuideLegendRow(color: Color("Ovulation"), text: "Bestätigter Anstieg / Prognose")
                    GuideLegendRow(color: Color("AppPrimary"), text: "Heute / ausgewählter Tag")
                }
                .padding()
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))

                GuideInfoCard(
                    icon: "crown.fill",
                    title: "Analyse (Lifetime)",
                    text: "Analyse, Prognosen, Zyklusvergleich und PDF-Export sind im Lifetime-Zugang enthalten."
                )

                Text("Hinweis: Prognosen sind Schätzungen und ersetzen keine medizinische Beratung.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
            .padding()
        }
        .navigationTitle("Anleitung")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct GuideInfoCard: View {
    let icon: String
    let title: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(Color("AppPrimary"))
                .frame(width: 34, height: 34)
                .background(Color("AppPrimary").opacity(0.12), in: RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(text)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

private struct GuideStepRow: View {
    let title: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.subheadline.weight(.semibold))
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct GuideLegendRow: View {
    let color: Color
    let text: String

    var body: some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 6)
                .fill(color.opacity(0.18))
                .frame(width: 28, height: 18)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(color.opacity(0.35), lineWidth: 1)
                )
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}
