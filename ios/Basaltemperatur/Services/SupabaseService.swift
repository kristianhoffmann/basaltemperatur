// ios/Basaltemperatur/Services/SupabaseService.swift
// Supabase-Client für Auth und Datenzugriff

import Foundation
import Combine
import Security
import UIKit

// MARK: - Keychain Helper

private struct KeychainHelper {
    static func save(_ value: String, forKey key: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "co.basaltemperatur.app",
        ]
        SecItemDelete(query as CFDictionary)
        var addQuery = query
        addQuery[kSecValueData as String] = data
        addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(addQuery as CFDictionary, nil)
    }
    
    static func load(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "co.basaltemperatur.app",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    static func delete(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "co.basaltemperatur.app",
        ]
        SecItemDelete(query as CFDictionary)
    }
}

class SupabaseService: ObservableObject {
    // MARK: - Configuration
    /// Supabase configuration constants.
    /// The Anon Key is a *public* client key (not a secret) — it is safe to embed.
    private enum Config {
        static let supabaseUrl = "https://scohibllvlqujmvtuamv.supabase.co"
        static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjb2hpYmxsdmxxdWptdnR1YW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjkwMDEsImV4cCI6MjA4NjY0NTAwMX0._Yg8bzOei4HVUkgUgPpQDoSAYKSA7m98LIDfW8NMJ8g"
        static let webAppUrl = "https://www.basaltemperatur.online"
        static let sensitiveDataConsentVersion = "2026-05-18"
    }

    private let supabaseUrl: String
    private let supabaseAnonKey: String
    @Published private(set) var sensitiveDataConsentRevision = 0
    
    private var accessToken: String?
    private var userId: String?
    private var refreshToken: String?
    private let appTrafficSessionId = UUID().uuidString
    private let refreshStateQueue = DispatchQueue(label: "co.basaltemperatur.app.refresh")
    private var inFlightRefreshTask: Task<Void, Error>?
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        return decoder
    }()
    
    init() {
        self.supabaseUrl = Config.supabaseUrl
        self.supabaseAnonKey = Config.supabaseAnonKey

        // Restore tokens from Keychain (secure storage)
        self.accessToken = KeychainHelper.load(forKey: "access_token")
        self.userId = KeychainHelper.load(forKey: "user_id")
        self.refreshToken = KeychainHelper.load(forKey: "refresh_token")
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
        persistSession(accessToken: response.accessToken, refreshToken: response.refreshToken, userId: response.user?.id)
        return response
    }
    
    func signUp(email: String, password: String, sensitiveDataConsent: Bool) async throws -> AuthResponse {
        let url = URL(string: "\(supabaseUrl)/auth/v1/signup")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        var body: [String: Any] = [
            "email": email,
            "password": password,
        ]
        if sensitiveDataConsent {
            body["data"] = [
                "sensitive_data_consent": true,
                "sensitive_data_consent_version": Config.sensitiveDataConsentVersion,
            ]
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
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
            self.userId = response.user?.id
            self.refreshToken = response.refreshToken
            persistSession(accessToken: response.accessToken, refreshToken: response.refreshToken, userId: response.user?.id)
        }
        return response
    }
    
    func signOut() {
        self.accessToken = nil
        self.refreshToken = nil
        self.userId = nil
        clearPersistedSession()
    }
    
    /// Refresh the access token using the stored refresh token
    func refreshSession() async throws {
        let refreshTask: Task<Void, Error> = refreshStateQueue.sync {
            if let existingTask = inFlightRefreshTask {
                return existingTask
            }

            let newTask = Task<Void, Error> { [weak self] in
                guard let self else {
                    throw SupabaseError.requestFailed
                }
                defer {
                    self.refreshStateQueue.sync {
                        self.inFlightRefreshTask = nil
                    }
                }
                try await self.performRefreshSession()
            }

            inFlightRefreshTask = newTask
            return newTask
        }

        try await refreshTask.value
    }

    private func performRefreshSession() async throws {
        guard let rt = refreshToken ?? KeychainHelper.load(forKey: "refresh_token") else {
            clearPersistedSession()
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
            self.userId = nil
            clearPersistedSession()
            throw SupabaseError.notAuthenticated
        }
        
        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        self.accessToken = authResponse.accessToken
        self.refreshToken = authResponse.refreshToken
        self.userId = authResponse.user?.id ?? self.userId
        persistSession(
            accessToken: authResponse.accessToken,
            refreshToken: authResponse.refreshToken,
            userId: self.userId
        )
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
    
    func saveTemperatureEntry(
        date: String,
        temperature: Double,
        notes: String?,
        cervicalMucus: CervicalMucusType?,
        measurementTime: String?,
        sleepHours: Double?,
        disturbed: Bool,
        disturbanceReason: String?,
        excludeFromAnalysis: Bool
    ) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/temperature_entries?on_conflict=user_id,date")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
        addAuthHeaders(to: &request)
        
        var body: [String: Any] = [
            "date": date,
            "temperature": temperature,
            "disturbed": disturbed,
            "exclude_from_analysis": excludeFromAnalysis,
        ]
        if let uid = userId {
            body["user_id"] = uid
        }
        body["notes"] = (notes?.isEmpty == false) ? notes! : NSNull()
        body["cervical_mucus"] = cervicalMucus?.rawValue ?? NSNull()
        if let measurementTime, !measurementTime.isEmpty {
            body["measurement_time"] = measurementTime
        } else {
            body["measurement_time"] = NSNull()
        }
        if let sleepHours {
            body["sleep_hours"] = sleepHours
        } else {
            body["sleep_hours"] = NSNull()
        }
        if let disturbanceReason, !disturbanceReason.isEmpty {
            body["disturbance_reason"] = disturbanceReason
        } else {
            body["disturbance_reason"] = NSNull()
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
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
        
        let (_, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
            throw SupabaseError.requestFailed
        }
    }
    
    func deletePeriodEntry(date: String) async throws {
        guard let uid = userId else { throw SupabaseError.notAuthenticated }
        let url = URL(string: "\(supabaseUrl)/rest/v1/period_entries?date=eq.\(date)&user_id=eq.\(uid)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeaders(to: &request)

        let (_, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
            throw SupabaseError.requestFailed
        }
    }
    
    // MARK: - User Profile

    func getUserProfile() async throws -> UserProfile {
        guard let uid = userId else {
            throw SupabaseError.notAuthenticated
        }

        let url = URL(string: "\(supabaseUrl)/rest/v1/profiles?select=*&id=eq.\(uid)&limit=1")!
        let data = try await authenticatedRequest(url: url)
        let profiles = try decoder.decode([UserProfile].self, from: data)

        guard let profile = profiles.first else {
            throw SupabaseError.requestFailed
        }

        return profile
    }

    func updateSensitiveDataConsent(version: String = Config.sensitiveDataConsentVersion) async throws {
        guard let uid = userId else {
            throw SupabaseError.notAuthenticated
        }

        do {
            try await updateSensitiveDataConsentViaWebApi()
        } catch {
            #if DEBUG
            print("Consent API update failed, falling back to direct profile update: \(error)")
            #endif
            try await updateSensitiveDataConsentDirectly(userId: uid, version: version)
        }

        await MainActor.run {
            sensitiveDataConsentRevision += 1
        }
    }

    private func updateSensitiveDataConsentViaWebApi() async throws {
        let url = URL(string: "\(Config.webAppUrl)/api/onboarding")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "sensitive_data_consent": true,
            "cycle_length_default": 28,
        ])

        let (data, httpResponse) = try await sendAuthenticatedRequest(request, includeApiKey: false)
        guard httpResponse.statusCode < 300 else {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["error"] as? String ?? json["message"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
    }

    private func updateSensitiveDataConsentDirectly(userId uid: String, version: String) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/profiles?id=eq.\(uid)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        addAuthHeaders(to: &request)

        let now = ISO8601DateFormatter().string(from: Date())
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "sensitive_data_consent_at": now,
            "sensitive_data_consent_version": version,
            "intended_use_acknowledged_at": now,
            "onboarding_completed": true,
        ])

        let (data, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["message"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
    }

    func revokeSensitiveDataConsent() async throws {
        guard let uid = userId else {
            throw SupabaseError.notAuthenticated
        }

        let url = URL(string: "\(supabaseUrl)/rest/v1/profiles?id=eq.\(uid)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        addAuthHeaders(to: &request)

        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "sensitive_data_consent_at": NSNull(),
            "sensitive_data_consent_version": NSNull(),
            "intended_use_acknowledged_at": NSNull(),
            "onboarding_completed": false,
        ])

        let (data, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["message"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }

        let metadataUrl = URL(string: "\(supabaseUrl)/auth/v1/user")!
        var metadataRequest = URLRequest(url: metadataUrl)
        metadataRequest.httpMethod = "PUT"
        metadataRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        metadataRequest.httpBody = try JSONSerialization.data(withJSONObject: [
            "data": [
                "sensitive_data_consent": false,
                "sensitive_data_consent_version": NSNull(),
            ]
        ])
        _ = try? await sendAuthenticatedRequest(metadataRequest)

        await MainActor.run {
            sensitiveDataConsentRevision += 1
        }
    }
    
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
        
        let (_, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
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
        let webAppUrl = Config.webAppUrl
        let url = URL(string: "\(webAppUrl)/api/delete-account")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        let (data, httpResponse) = try await sendAuthenticatedRequest(request, includeApiKey: false)
        guard httpResponse.statusCode < 300 else {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["error"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
    }

    // MARK: - App Store Entitlement

    func syncAppStoreEntitlement(signedTransactionInfo: String) async throws {
        let url = URL(string: "\(Config.webAppUrl)/api/app-store/entitlement")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "signedTransactionInfo": signedTransactionInfo
        ])

        let (data, httpResponse) = try await sendAuthenticatedRequest(request, includeApiKey: false)
        guard httpResponse.statusCode < 300 else {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["error"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
    }

    // MARK: - Traffic Analytics

    func trackTrafficEvent(path: String, title: String, eventType: String = "pageview") async {
        let url = URL(string: "\(Config.webAppUrl)/api/traffic")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let screenSize = await MainActor.run { UIScreen.main.bounds.size }

        let body: [String: Any] = [
            "eventType": eventType,
            "visitorId": appTrafficVisitorId(),
            "sessionId": appTrafficSessionId,
            "path": path,
            "url": "\(Config.webAppUrl)\(path)",
            "title": title,
            "language": Locale.current.identifier,
            "languages": Locale.preferredLanguages,
            "timezone": TimeZone.current.identifier,
            "screenWidth": Int(screenSize.width),
            "screenHeight": Int(screenSize.height),
            "viewportWidth": Int(screenSize.width),
            "viewportHeight": Int(screenSize.height),
            "colorScheme": "light",
            "connectionType": "ios-app",
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            _ = try await URLSession.shared.data(for: request)
        } catch {
            // Analytics must never block app usage.
        }
    }
    
    // MARK: - Helpers
    
    private func authenticatedRequest(url: URL) async throws -> Data {
        let request = URLRequest(url: url)
        let (data, httpResponse) = try await sendAuthenticatedRequest(request)
        guard httpResponse.statusCode < 300 else {
            if httpResponse.statusCode == 401 || httpResponse.statusCode == 403 {
                throw SupabaseError.notAuthenticated
            }
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = json["message"] as? String {
                throw SupabaseError.apiError(msg)
            }
            throw SupabaseError.requestFailed
        }
        return data
    }

    private func addAuthHeaders(to request: inout URLRequest, includeApiKey: Bool = true) {
        if includeApiKey {
            request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        }
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    private func sendAuthenticatedRequest(
        _ request: URLRequest,
        includeApiKey: Bool = true,
        retryOnUnauthorized: Bool = true
    ) async throws -> (Data, HTTPURLResponse) {
        var firstRequest = request
        addAuthHeaders(to: &firstRequest, includeApiKey: includeApiKey)
        let (data, response) = try await URLSession.shared.data(for: firstRequest)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if retryOnUnauthorized && (httpResponse.statusCode == 401 || httpResponse.statusCode == 403) {
            try await refreshSession()
            var retryRequest = request
            addAuthHeaders(to: &retryRequest, includeApiKey: includeApiKey)
            let (retryData, retryResponse) = try await URLSession.shared.data(for: retryRequest)
            guard let retryHttpResponse = retryResponse as? HTTPURLResponse else {
                throw SupabaseError.requestFailed
            }
            return (retryData, retryHttpResponse)
        }

        return (data, httpResponse)
    }

    private func persistSession(accessToken: String?, refreshToken: String?, userId: String?) {
        if let token = accessToken {
            KeychainHelper.save(token, forKey: "access_token")
        }
        if let rt = refreshToken {
            KeychainHelper.save(rt, forKey: "refresh_token")
        }
        if let uid = userId {
            KeychainHelper.save(uid, forKey: "user_id")
        }
    }

    private func clearPersistedSession() {
        KeychainHelper.delete(forKey: "access_token")
        KeychainHelper.delete(forKey: "refresh_token")
        KeychainHelper.delete(forKey: "user_id")
    }

    private func appTrafficVisitorId() -> String {
        let key = "traffic_visitor_id"
        if let existing = UserDefaults.standard.string(forKey: key) {
            return existing
        }
        let value = UUID().uuidString
        UserDefaults.standard.set(value, forKey: key)
        return value
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
