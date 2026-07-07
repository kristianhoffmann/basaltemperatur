// ios/Basaltemperatur/ViewModels/AuthViewModel.swift

import Foundation
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var userEmail: String = ""
    @Published var userName: String = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    // Check stored session on launch
    init() {
        // Restore display-only metadata (not secrets)
        self.userEmail = UserDefaults.standard.string(forKey: "user_email") ?? ""
        self.userName = UserDefaults.standard.string(forKey: "user_name") ?? ""
        // Auth state will be resolved by checkSession() on appear
        self.needsRefresh = true
    }
    
    private var needsRefresh = false
    
    /// Call this on app appear to refresh an expired session
    func checkSession(supabase: SupabaseService) async {
        guard needsRefresh || isAuthenticated else { return }
        do {
            try await supabase.refreshSession()
            self.isAuthenticated = true
            needsRefresh = false
        } catch let error as SupabaseError {
            if case .notAuthenticated = error {
                // Refresh token truly invalid -> log out locally
                #if DEBUG
                print("Session refresh failed: \(error)")
                #endif
                self.isAuthenticated = false
                needsRefresh = false
            } else {
                #if DEBUG
                print("Session refresh skipped due transient error: \(error)")
                #endif
                needsRefresh = true
            }
        } catch {
            #if DEBUG
            print("Session refresh skipped due transient error: \(error)")
            #endif
            needsRefresh = true
        }
    }
    
    func signIn(email: String, password: String, supabase: SupabaseService) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let _ = try await supabase.signIn(email: email, password: password)
            isAuthenticated = true
            userEmail = email
            
            // Persist display-only metadata
            UserDefaults.standard.set(email, forKey: "user_email")
            
            // Load user name from metadata
            await loadUserMetadata(supabase: supabase)
        } catch {
            errorMessage = "Anmeldung fehlgeschlagen. Bitte überprüfe deine Daten."
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String, sensitiveDataConsent: Bool, supabase: SupabaseService) async {
        isLoading = true
        errorMessage = nil

        guard sensitiveDataConsent else {
            errorMessage = "Bitte willige in die Verarbeitung deiner Gesundheitsdaten ein."
            isLoading = false
            return
        }
        
        do {
            let response = try await supabase.signUp(
                email: email,
                password: password,
                sensitiveDataConsent: sensitiveDataConsent
            )
            
            if response.accessToken != nil {
                // Direct login (no email confirmation required)
                isAuthenticated = true
                userEmail = email
                UserDefaults.standard.set(email, forKey: "user_email")
                try? await supabase.updateSensitiveDataConsent()
            } else {
                // Email confirmation required
                errorMessage = "✅ Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach und bestätige deine E-Mail-Adresse."
            }
        } catch {
            errorMessage = "Registrierung fehlgeschlagen: \(error.localizedDescription)"
            #if DEBUG
            print("SignUp error: \(error)")
            #endif
        }
        
        isLoading = false
    }
    
    func signOut(supabase: SupabaseService) {
        supabase.signOut()
        isAuthenticated = false
        userEmail = ""
        userName = ""
        UserDefaults.standard.removeObject(forKey: "user_email")
        UserDefaults.standard.removeObject(forKey: "user_name")
    }
    
    // MARK: - Profile Management
    
    func loadUserMetadata(supabase: SupabaseService) async {
        do {
            let metadata = try await supabase.getUserMetadata()
            if let name = metadata["owner_name"] as? String {
                userName = name
                UserDefaults.standard.set(name, forKey: "user_name")
            }
        } catch {
            #if DEBUG
            print("Failed to load user metadata: \(error)")
            #endif
        }
    }
    
    func updateName(_ name: String, supabase: SupabaseService) async throws {
        try await supabase.updateUserName(name)
        userName = name
        UserDefaults.standard.set(name, forKey: "user_name")
    }
    
    func deleteAccount(supabase: SupabaseService) async throws {
        try await supabase.deleteAccount()
        // Clear all local state
        signOut(supabase: supabase)
    }
}
