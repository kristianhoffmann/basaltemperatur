// ios/Basaltemperatur/Views/SettingsView.swift

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var supabase: SupabaseService
    
    @State private var editingName = false
    @State private var nameText = ""
    @State private var isSavingName = false
    
    @State private var showDeleteAlert = false
    @State private var deleteConfirmText = ""
    @State private var isDeleting = false
    @State private var deleteError: String?
    
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
                                Text("Lifetime Zugang")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Account")
                }
                
                // Profil bearbeiten
                Section {
                    if editingName {
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
                                        do {
                                            try await authViewModel.updateName(nameText, supabase: supabase)
                                            editingName = false
                                        } catch {
                                            // Show error inline
                                        }
                                        isSavingName = false
                                    }
                                }
                                .disabled(nameText.trimmingCharacters(in: .whitespaces).isEmpty)
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
                        PDFExportView()
                            .environmentObject(supabase)
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("PDF-Export")
                                Text("Zykluskurve für den Arzt")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: "doc.richtext")
                        }
                    }
                    
                    NavigationLink {
                        Text("Zykluslänge einstellen") // Placeholder
                    } label: {
                        Label("Zykluslänge", systemImage: "calendar.badge.clock")
                    }
                    
                    NavigationLink {
                        Text("Temperatureinheit") // Placeholder
                    } label: {
                        Label("Einheiten", systemImage: "thermometer")
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
                        deleteConfirmText = ""
                        deleteError = nil
                        showDeleteAlert = true
                    } label: {
                        Label("Konto löschen", systemImage: "trash")
                    }
                } header: {
                    Text("Gefahrenzone")
                } footer: {
                    Text("Dein Konto und alle Daten werden unwiderruflich gelöscht.")
                }
            }
            .navigationTitle("Einstellungen")
            .navigationBarTitleDisplayMode(.inline)
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
                if isDeleting {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()
                        VStack(spacing: 12) {
                            ProgressView()
                            Text("Konto wird gelöscht...")
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
            }
        }
    }
}
