// ios/Basaltemperatur/Services/SupabaseService.swift
// Supabase-Client für Auth und Datenzugriff

import Foundation
import Combine

class SupabaseService: ObservableObject {
    // MARK: - Configuration
    // TODO: Diese Werte in eine .xcconfig oder Info.plist auslagern
    private let supabaseUrl = "https://scohibllvlqujmvtuamv.supabase.co"
    private let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjb2hpYmxsdmxxdWptdnR1YW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjkwMDEsImV4cCI6MjA4NjY0NTAwMX0._Yg8bzOei4HVUkgUgPpQDoSAYKSA7m98LIDfW8NMJ8g"
    
    private var accessToken: String?
    private var userId: String?
    private var refreshToken: String?
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        return decoder
    }()
    
    init() {
        // Restore token, userId, and refreshToken from UserDefaults
        self.accessToken = UserDefaults.standard.string(forKey: "access_token")
        self.userId = UserDefaults.standard.string(forKey: "user_id")
        self.refreshToken = UserDefaults.standard.string(forKey: "refresh_token")
    }
    
    // MARK: - Auth
    
    func signIn(email: String, password: String) async throws -> AuthResponse {
        let url = URL(string: "\(supabaseUrl)/auth/v1/token?grant_type=password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try decoder.decode(AuthResponse.self, from: data)
        self.accessToken = response.accessToken
        self.userId = response.user?.id
        self.refreshToken = response.refreshToken
        if let uid = response.user?.id {
            UserDefaults.standard.set(uid, forKey: "user_id")
        }
        if let rt = response.refreshToken {
            UserDefaults.standard.set(rt, forKey: "refresh_token")
        }
        return response
    }
    
    func signUp(email: String, password: String) async throws -> AuthResponse {
        let url = URL(string: "\(supabaseUrl)/auth/v1/signup")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, httpResponse) = try await URLSession.shared.data(for: request)
        
        // Check for HTTP errors
        if let httpResp = httpResponse as? HTTPURLResponse, httpResp.statusCode >= 400 {
            if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = errorJson["msg"] as? String ?? errorJson["message"] as? String ?? errorJson["error_description"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
        
        let response = try decoder.decode(AuthResponse.self, from: data)
        if let token = response.accessToken {
            self.accessToken = token
        }
        return response
    }
    
    func signOut() {
        self.accessToken = nil
        self.refreshToken = nil
        UserDefaults.standard.removeObject(forKey: "refresh_token")
    }
    
    /// Refresh the access token using the stored refresh token
    func refreshSession() async throws {
        guard let rt = refreshToken ?? UserDefaults.standard.string(forKey: "refresh_token") else {
            throw SupabaseError.notAuthenticated
        }
        
        let url = URL(string: "\(supabaseUrl)/auth/v1/token?grant_type=refresh_token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let body = ["refresh_token": rt]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            // Refresh failed — clear tokens
            self.accessToken = nil
            self.refreshToken = nil
            UserDefaults.standard.removeObject(forKey: "access_token")
            UserDefaults.standard.removeObject(forKey: "refresh_token")
            throw SupabaseError.notAuthenticated
        }
        
        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        self.accessToken = authResponse.accessToken
        self.refreshToken = authResponse.refreshToken
        self.userId = authResponse.user?.id
        
        if let token = authResponse.accessToken {
            UserDefaults.standard.set(token, forKey: "access_token")
        }
        if let newRt = authResponse.refreshToken {
            UserDefaults.standard.set(newRt, forKey: "refresh_token")
        }
        if let uid = authResponse.user?.id {
            UserDefaults.standard.set(uid, forKey: "user_id")
        }
    }
    
    // MARK: - Temperature Entries
    
    func getTemperatureEntries(days: Int = 0) async throws -> [TemperatureEntry] {
        var urlStr = "\(supabaseUrl)/rest/v1/temperature_entries?select=*&order=date.asc"
        if days > 0 {
            let startDate = Calendar.current.date(byAdding: .day, value: -days, to: Date())!
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            urlStr += "&date=gte.\(formatter.string(from: startDate))"
        }
        let url = URL(string: urlStr)!
        let data = try await authenticatedRequest(url: url)
        return try decoder.decode([TemperatureEntry].self, from: data)
    }
    
    func saveTemperatureEntry(date: String, temperature: Double, notes: String?) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/temperature_entries?on_conflict=user_id,date")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
        addAuthHeaders(to: &request)
        
        var body: [String: Any] = [
            "date": date,
            "temperature": temperature,
        ]
        if let uid = userId {
            body["user_id"] = uid
        }
        if let notes = notes, !notes.isEmpty {
            body["notes"] = notes
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            let responseStr = String(data: data, encoding: .utf8) ?? "no body"
            print("Save temp error: \(responseStr)")
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["message"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
    }
    
    // MARK: - Period Entries
    
    func getPeriodEntries(days: Int = 0) async throws -> [PeriodEntry] {
        var urlStr = "\(supabaseUrl)/rest/v1/period_entries?select=*&order=date.asc"
        if days > 0 {
            let startDate = Calendar.current.date(byAdding: .day, value: -days, to: Date())!
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            urlStr += "&date=gte.\(formatter.string(from: startDate))"
        }
        
        let url = URL(string: urlStr)!
        let data = try await authenticatedRequest(url: url)
        return try decoder.decode([PeriodEntry].self, from: data)
    }
    
    func savePeriodEntry(date: String, flowIntensity: FlowIntensity) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/period_entries?on_conflict=user_id,date")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
        addAuthHeaders(to: &request)
        
        var body: [String: Any] = [
            "date": date,
            "flow_intensity": flowIntensity.rawValue,
        ]
        if let uid = userId {
            body["user_id"] = uid
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            throw SupabaseError.requestFailed
        }
    }
    
    func deletePeriodEntry(date: String) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/period_entries?date=eq.\(date)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeaders(to: &request)
        
        let (_, _) = try await URLSession.shared.data(for: request)
    }
    
    // MARK: - User Profile
    
    func updateUserName(_ name: String) async throws {
        let url = URL(string: "\(supabaseUrl)/auth/v1/user")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let body: [String: Any] = [
            "data": ["owner_name": name]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            throw SupabaseError.requestFailed
        }
    }
    
    func getUserMetadata() async throws -> [String: Any] {
        let url = URL(string: "\(supabaseUrl)/auth/v1/user")!
        let data = try await authenticatedRequest(url: url)
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return (json["user_metadata"] as? [String: Any]) ?? [:]
    }
    
    // MARK: - Account Deletion
    
    /// Calls the Next.js API route to delete the account and all data
    func deleteAccount() async throws {
        // Use the web app's API route for deletion (uses admin client server-side)
        let webAppUrl = "https://basaltemperatur.app"
        let url = URL(string: "\(webAppUrl)/api/delete-account")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["error"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
    }
    
    // MARK: - Helpers
    
    private func authenticatedRequest(url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        addAuthHeaders(to: &request)
        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }
    
    private func addAuthHeaders(to request: inout URLRequest) {
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }
}

// MARK: - Models

struct AuthResponse: Codable {
    let accessToken: String?
    let refreshToken: String?
    let user: AuthUser?
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }
    
    var requiresEmailConfirmation: Bool {
        return accessToken == nil
    }
}

struct AuthUser: Codable {
    let id: String
    let email: String?
}

enum SupabaseError: LocalizedError {
    case requestFailed
    case notAuthenticated
    case apiError(String)
    
    var errorDescription: String? {
        switch self {
        case .requestFailed: return "Anfrage fehlgeschlagen"
        case .notAuthenticated: return "Nicht angemeldet"
        case .apiError(let message): return message
        }
    }
}
