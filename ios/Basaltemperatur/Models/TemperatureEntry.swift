// ios/Basaltemperatur/Models/TemperatureEntry.swift

import Foundation

struct TemperatureEntry: Identifiable, Codable {
    let id: String
    let userId: String
    let date: String
    let temperature: Double
    let notes: String?
    let cervicalMucus: CervicalMucusType?
    let measurementTime: String?
    let sleepHours: Double?
    let disturbed: Bool
    let disturbanceReason: String?
    let excludeFromAnalysis: Bool
    let createdAt: String?
    let updatedAt: String?

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case temperature
        case notes
        case cervicalMucus = "cervical_mucus"
        case measurementTime = "measurement_time"
        case sleepHours = "sleep_hours"
        case disturbed
        case disturbanceReason = "disturbance_reason"
        case excludeFromAnalysis = "exclude_from_analysis"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    init(
        id: String,
        userId: String,
        date: String,
        temperature: Double,
        notes: String?,
        cervicalMucus: CervicalMucusType?,
        measurementTime: String?,
        sleepHours: Double?,
        disturbed: Bool,
        disturbanceReason: String?,
        excludeFromAnalysis: Bool,
        createdAt: String?,
        updatedAt: String?
    ) {
        self.id = id
        self.userId = userId
        self.date = date
        self.temperature = temperature
        self.notes = notes
        self.cervicalMucus = cervicalMucus
        self.measurementTime = measurementTime
        self.sleepHours = sleepHours
        self.disturbed = disturbed
        self.disturbanceReason = disturbanceReason
        self.excludeFromAnalysis = excludeFromAnalysis
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        userId = try c.decode(String.self, forKey: .userId)
        date = try c.decode(String.self, forKey: .date)
        temperature = try c.decode(Double.self, forKey: .temperature)
        notes = try c.decodeIfPresent(String.self, forKey: .notes)
        cervicalMucus = try c.decodeIfPresent(CervicalMucusType.self, forKey: .cervicalMucus)
        measurementTime = try c.decodeIfPresent(String.self, forKey: .measurementTime)
        sleepHours = try c.decodeIfPresent(Double.self, forKey: .sleepHours)
        disturbed = try c.decodeIfPresent(Bool.self, forKey: .disturbed) ?? false
        disturbanceReason = try c.decodeIfPresent(String.self, forKey: .disturbanceReason)
        excludeFromAnalysis = try c.decodeIfPresent(Bool.self, forKey: .excludeFromAnalysis) ?? false
        createdAt = try c.decodeIfPresent(String.self, forKey: .createdAt)
        updatedAt = try c.decodeIfPresent(String.self, forKey: .updatedAt)
    }
    
    var dateObject: Date {
        Self.dateFormatter.date(from: date) ?? Date()
    }
    
    var formattedTemperature: String {
        String(format: "%.2f°C", temperature)
    }

    var isUsableForAnalysis: Bool {
        !disturbed && !excludeFromAnalysis
    }
}

enum CervicalMucusType: String, Codable, CaseIterable {
    case dry
    case sticky
    case creamy
    case watery
    case eggwhite

    var displayName: String {
        switch self {
        case .dry: return "Trocken"
        case .sticky: return "Klebrig"
        case .creamy: return "Cremig"
        case .watery: return "Wässrig"
        case .eggwhite: return "Spinnbar"
        }
    }
}

struct PeriodEntry: Identifiable, Codable {
    let id: String
    let userId: String
    let date: String
    let flowIntensity: FlowIntensity
    let createdAt: String?

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case flowIntensity = "flow_intensity"
        case createdAt = "created_at"
    }

    init(
        id: String,
        userId: String,
        date: String,
        flowIntensity: FlowIntensity,
        createdAt: String?
    ) {
        self.id = id
        self.userId = userId
        self.date = date
        self.flowIntensity = flowIntensity
        self.createdAt = createdAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        userId = try c.decode(String.self, forKey: .userId)
        date = try c.decode(String.self, forKey: .date)
        flowIntensity = try c.decodeIfPresent(FlowIntensity.self, forKey: .flowIntensity) ?? .medium
        createdAt = try c.decodeIfPresent(String.self, forKey: .createdAt)
    }

    var dateObject: Date {
        Self.dateFormatter.date(from: date) ?? Date()
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
    var entitlementSource: String?
    var lifetimeAccessGrantedAt: String?
    var onboardingCompleted: Bool
    var sensitiveDataConsentAt: String?
    var sensitiveDataConsentVersion: String?
    var intendedUseAcknowledgedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case cycleLengthDefault = "cycle_length_default"
        case lutealPhaseDefault = "luteal_phase_default"
        case temperatureUnit = "temperature_unit"
        case hasLifetimeAccess = "has_lifetime_access"
        case entitlementSource = "entitlement_source"
        case lifetimeAccessGrantedAt = "lifetime_access_granted_at"
        case onboardingCompleted = "onboarding_completed"
        case sensitiveDataConsentAt = "sensitive_data_consent_at"
        case sensitiveDataConsentVersion = "sensitive_data_consent_version"
        case intendedUseAcknowledgedAt = "intended_use_acknowledged_at"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        displayName = try c.decodeIfPresent(String.self, forKey: .displayName)
        cycleLengthDefault = try c.decodeIfPresent(Int.self, forKey: .cycleLengthDefault) ?? 28
        lutealPhaseDefault = try c.decodeIfPresent(Int.self, forKey: .lutealPhaseDefault) ?? 14
        temperatureUnit = try c.decodeIfPresent(String.self, forKey: .temperatureUnit) ?? "celsius"
        hasLifetimeAccess = try c.decodeIfPresent(Bool.self, forKey: .hasLifetimeAccess) ?? false
        entitlementSource = try c.decodeIfPresent(String.self, forKey: .entitlementSource)
        lifetimeAccessGrantedAt = try c.decodeIfPresent(String.self, forKey: .lifetimeAccessGrantedAt)
        onboardingCompleted = try c.decodeIfPresent(Bool.self, forKey: .onboardingCompleted) ?? false
        sensitiveDataConsentAt = try c.decodeIfPresent(String.self, forKey: .sensitiveDataConsentAt)
        sensitiveDataConsentVersion = try c.decodeIfPresent(String.self, forKey: .sensitiveDataConsentVersion)
        intendedUseAcknowledgedAt = try c.decodeIfPresent(String.self, forKey: .intendedUseAcknowledgedAt)
    }
}
