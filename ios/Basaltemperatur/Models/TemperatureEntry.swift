// ios/Basaltemperatur/Models/TemperatureEntry.swift

import Foundation

struct TemperatureEntry: Identifiable, Codable {
    let id: String
    let userId: String
    let date: String
    let temperature: Double
    let notes: String?
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case temperature
        case notes
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    var dateObject: Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: date) ?? Date()
    }
    
    var formattedTemperature: String {
        String(format: "%.2f°C", temperature)
    }
}

struct PeriodEntry: Identifiable, Codable {
    let id: String
    let userId: String
    let date: String
    let flowIntensity: FlowIntensity
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case flowIntensity = "flow_intensity"
        case createdAt = "created_at"
    }
    
    var dateObject: Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: date) ?? Date()
    }
}

enum FlowIntensity: String, Codable, CaseIterable {
    case light
    case medium
    case heavy
    case spotting
    
    var displayName: String {
        switch self {
        case .light: return "Leicht"
        case .medium: return "Mittel"
        case .heavy: return "Stark"
        case .spotting: return "Schmierblutung"
        }
    }
    
    var color: String {
        switch self {
        case .spotting: return "PeriodSpotting"
        case .light: return "PeriodLight"
        case .medium: return "PeriodMedium"
        case .heavy: return "PeriodHeavy"
        }
    }
}

struct Cycle: Identifiable, Codable {
    let id: String
    let userId: String
    let startDate: String
    let endDate: String?
    let ovulationDate: String?
    let cycleLength: Int?
    let coverLineTemp: Double?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case ovulationDate = "ovulation_date"
        case cycleLength = "cycle_length"
        case coverLineTemp = "cover_line_temp"
    }
}

struct UserProfile: Codable {
    let id: String
    var displayName: String?
    var cycleLengthDefault: Int
    var lutealPhaseDefault: Int
    var temperatureUnit: String
    var hasLifetimeAccess: Bool
    var onboardingCompleted: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case cycleLengthDefault = "cycle_length_default"
        case lutealPhaseDefault = "luteal_phase_default"
        case temperatureUnit = "temperature_unit"
        case hasLifetimeAccess = "has_lifetime_access"
        case onboardingCompleted = "onboarding_completed"
    }
}
