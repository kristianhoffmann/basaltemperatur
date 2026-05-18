// ios/Basaltemperatur/Views/MainTabView.swift

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var supabase: SupabaseService
    @State private var selectedTab = 0
    @State private var showGuideSheet = false
    @State private var isCheckingSensitiveDataConsent = true
    @State private var needsSensitiveDataConsent = false
    @State private var isSavingSensitiveDataConsent = false
    @State private var sensitiveDataConsentError: String?
    @AppStorage("hasSeenGuide") private var hasSeenGuide = false
    
    var body: some View {
        Group {
            if isCheckingSensitiveDataConsent {
                ProgressView()
                    .tint(Color("AppPrimary"))
            } else if needsSensitiveDataConsent {
                SensitiveDataConsentGateView(
                    isSaving: isSavingSensitiveDataConsent,
                    errorMessage: sensitiveDataConsentError,
                    onAccept: {
                        Task { await acceptSensitiveDataConsent() }
                    }
                )
            } else {
                mainTabs
            }
        }
        .task {
            await refreshSensitiveDataConsentGate()
            await trackSelectedTab()
        }
        .onReceive(supabase.$sensitiveDataConsentRevision) { _ in
            Task { await refreshSensitiveDataConsentGate() }
        }
        .onChange(of: selectedTab) { _, _ in
            Task { await trackSelectedTab() }
        }
    }

    private var mainTabs: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "chart.xyaxis.line")
                    Text("Dashboard")
                }
                .tag(0)
            
            CalendarTabView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Kalender")
                }
                .tag(1)
            
            StatisticsView()
                .tabItem {
                    Image(systemName: "chart.bar")
                    Text("Statistik")
                }
                .environmentObject(supabase)
                .tag(2)

            EntryView()
                .tabItem {
                    Image(systemName: "plus.circle.fill")
                    Text("Eintrag")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape")
                    Text("Mehr")
                }
                .tag(4)
        }
        .tint(Color("AppPrimary"))
        .onAppear {
            if !hasSeenGuide {
                showGuideSheet = true
            }
        }
        .sheet(isPresented: $showGuideSheet, onDismiss: {
            hasSeenGuide = true
        }) {
            NavigationStack {
                AppGuideView()
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Fertig") {
                                showGuideSheet = false
                                hasSeenGuide = true
                            }
                        }
                    }
            }
        }
    }

    @MainActor
    private func refreshSensitiveDataConsentGate() async {
        isCheckingSensitiveDataConsent = true
        defer { isCheckingSensitiveDataConsent = false }

        do {
            let profile = try await supabase.getUserProfile()
            needsSensitiveDataConsent = profile.sensitiveDataConsentAt == nil
            sensitiveDataConsentError = nil
        } catch {
            // Do not lock users out on transient profile failures; server-side write guards still apply.
            needsSensitiveDataConsent = false
            sensitiveDataConsentError = nil
            print("Sensitive data consent check failed: \(error)")
        }
    }

    @MainActor
    private func acceptSensitiveDataConsent() async {
        isSavingSensitiveDataConsent = true
        sensitiveDataConsentError = nil
        defer { isSavingSensitiveDataConsent = false }

        do {
            try await supabase.updateSensitiveDataConsent()
            needsSensitiveDataConsent = false
        } catch {
            sensitiveDataConsentError = "Einwilligung konnte nicht gespeichert werden. Bitte versuche es erneut."
            print("Sensitive data consent update failed: \(error)")
        }
    }

    private func trackSelectedTab() async {
        let screen: (path: String, title: String) = switch selectedTab {
        case 0: ("/ios/dashboard", "iOS Dashboard")
        case 1: ("/ios/calendar", "iOS Kalender")
        case 2: ("/ios/statistics", "iOS Statistik")
        case 3: ("/ios/entry", "iOS Eintrag")
        case 4: ("/ios/settings", "iOS Einstellungen")
        default: ("/ios/unknown", "iOS Unbekannt")
        }
        await supabase.trackTrafficEvent(path: screen.path, title: screen.title)
    }
}

private struct SensitiveDataConsentGateView: View {
    let isSaving: Bool
    let errorMessage: String?
    let onAccept: () -> Void

    @State private var acceptedSensitiveDataConsent = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "heart.text.square.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color("AppPrimary"))

            VStack(spacing: 8) {
                Text("Einwilligung erforderlich")
                    .font(.title2.weight(.bold))
                Text("Damit Basaltemperatur deine Zyklusdaten auswerten darf, brauchen wir deine ausdrückliche Zustimmung.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Toggle(isOn: $acceptedSensitiveDataConsent) {
                Text("Ich willige ausdrücklich ein, dass meine Gesundheitsdaten wie Temperaturwerte, Periodendaten, Zervixschleim und Störfaktoren für Zyklusauswertungen verarbeitet werden. Mir ist bewusst, dass die App kein Medizinprodukt ist und nicht zur Verhütung, Diagnose oder Behandlung verwendet werden darf.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .toggleStyle(.switch)
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }

            Button(action: onAccept) {
                HStack {
                    if isSaving {
                        ProgressView()
                            .tint(.white)
                    }
                    Text("Einwilligung speichern")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color("AppPrimary"), in: RoundedRectangle(cornerRadius: 16))
                .foregroundStyle(.white)
            }
            .disabled(!acceptedSensitiveDataConsent || isSaving)

            Spacer()
        }
        .padding()
    }
}
