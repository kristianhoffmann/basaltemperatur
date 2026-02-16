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
    
    private var accessToken: String? {
        didSet {
            isAuthenticated = accessToken != nil
        }
    }
    
    // Check stored session on launch
    init() {
        if let token = UserDefaults.standard.string(forKey: "access_token") {
            self.accessToken = token
            self.isAuthenticated = true
            self.userEmail = UserDefaults.standard.string(forKey: "user_email") ?? ""
            self.userName = UserDefaults.standard.string(forKey: "user_name") ?? ""
        } else if UserDefaults.standard.string(forKey: "refresh_token") != nil {
            // We have a refresh token but no access token — mark as needing refresh
            self.needsRefresh = true
        }
    }
    
    private var needsRefresh = false
    
    /// Call this on app appear to refresh an expired session
    func checkSession(supabase: SupabaseService) async {
        // If we restored from UserDefaults, try refreshing the token
        if needsRefresh || (accessToken != nil) {
            do {
                try await supabase.refreshSession()
                // Update local state from refreshed session
                if let token = UserDefaults.standard.string(forKey: "access_token") {
                    self.accessToken = token
                    self.isAuthenticated = true
                    self.userEmail = UserDefaults.standard.string(forKey: "user_email") ?? ""
                    self.userName = UserDefaults.standard.string(forKey: "user_name") ?? ""
                }
                needsRefresh = false
            } catch {
                // Refresh failed — session is invalid
                print("Session refresh failed: \(error)")
                self.accessToken = nil
                self.isAuthenticated = false
                needsRefresh = false
            }
        }
    }
    
    func signIn(email: String, password: String, supabase: SupabaseService) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await supabase.signIn(email: email, password: password)
            accessToken = response.accessToken
            userEmail = email
            
            // Persist
            UserDefaults.standard.set(response.accessToken, forKey: "access_token")
            UserDefaults.standard.set(email, forKey: "user_email")
            if let rt = response.refreshToken {
                UserDefaults.standard.set(rt, forKey: "refresh_token")
            }
            
            // Load user name from metadata
            await loadUserMetadata(supabase: supabase)
        } catch {
            errorMessage = "Anmeldung fehlgeschlagen. Bitte überprüfe deine Daten."
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String, supabase: SupabaseService) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await supabase.signUp(email: email, password: password)
            
            if let token = response.accessToken {
                // Direct login (no email confirmation required)
                accessToken = token
                userEmail = email
                UserDefaults.standard.set(token, forKey: "access_token")
                UserDefaults.standard.set(email, forKey: "user_email")
                if let rt = response.refreshToken {
                    UserDefaults.standard.set(rt, forKey: "refresh_token")
                }
            } else {
                // Email confirmation required
                errorMessage = "✅ Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach und bestätige deine E-Mail-Adresse."
            }
        } catch {
            errorMessage = "Registrierung fehlgeschlagen: \(error.localizedDescription)"
            print("SignUp error: \(error)")
        }
        
        isLoading = false
    }
    
    func signOut(supabase: SupabaseService) {
        supabase.signOut()
        accessToken = nil
        userEmail = ""
        userName = ""
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "user_email")
        UserDefaults.standard.removeObject(forKey: "user_name")
        UserDefaults.standard.removeObject(forKey: "refresh_token")
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
            print("Failed to load user metadata: \(error)")
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
