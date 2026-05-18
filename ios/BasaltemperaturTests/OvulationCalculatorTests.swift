import XCTest
@testable import Basaltemperatur

final class OvulationCalculatorTests: XCTestCase {
    func testDetectsStandardThreeOverSixTemperatureRise() {
        let entries = [
            entry("2026-01-01", 36.20),
            entry("2026-01-02", 36.30),
            entry("2026-01-03", 36.25),
            entry("2026-01-04", 36.35),
            entry("2026-01-05", 36.40),
            entry("2026-01-06", 36.30),
            entry("2026-01-07", 36.55),
            entry("2026-01-08", 36.62),
            entry("2026-01-09", 36.70),
        ]

        let results = OvulationCalculator.detectAllOvulations(entries: entries)

        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results.first?.ovulationDate, "2026-01-06")
        XCTAssertEqual(results.first?.coverLineTemp, 36.40)
        XCTAssertEqual(results.first?.source, .temperature)
        XCTAssertTrue(results.first?.isConfirmed == true)
    }

    func testDisturbedMeasurementsDoNotCreateFalseRise() {
        let entries = [
            entry("2026-01-01", 36.20),
            entry("2026-01-02", 36.30),
            entry("2026-01-03", 36.25),
            entry("2026-01-04", 36.35),
            entry("2026-01-05", 36.40),
            entry("2026-01-06", 36.30),
            entry("2026-01-07", 36.70, disturbed: true),
            entry("2026-01-08", 36.74),
            entry("2026-01-09", 36.76),
            entry("2026-01-10", 36.78),
        ]

        XCTAssertTrue(OvulationCalculator.detectAllOvulations(entries: entries).isEmpty)
    }

    func testMissingDayPreventsTemperatureRuleConfirmation() {
        let entries = [
            entry("2026-01-01", 36.20),
            entry("2026-01-02", 36.30),
            entry("2026-01-03", 36.25),
            entry("2026-01-05", 36.35),
            entry("2026-01-06", 36.40),
            entry("2026-01-07", 36.30),
            entry("2026-01-08", 36.55),
            entry("2026-01-09", 36.62),
            entry("2026-01-10", 36.70),
        ]

        XCTAssertTrue(OvulationCalculator.detectAllOvulations(entries: entries).isEmpty)
    }

    func testPredictionBaselineRequiresThreeCompletedCycles() {
        XCTAssertFalse(OvulationCalculator.hasReliablePredictionBaseline(periodEntries: [
            period("2026-01-01"),
            period("2026-01-29"),
            period("2026-02-26"),
        ]))

        XCTAssertTrue(OvulationCalculator.hasReliablePredictionBaseline(periodEntries: [
            period("2026-01-01"),
            period("2026-01-29"),
            period("2026-02-26"),
            period("2026-03-26"),
        ]))
    }

    func testPredictedFertilityWindowUsesObservedCycleLength() {
        let window = OvulationCalculator.getFertilityWindow(
            lastPeriodStart: "2026-01-01",
            cycleLength: 30,
            lutealPhase: 14
        )

        XCTAssertEqual(window?.start, "2026-01-12")
        XCTAssertEqual(window?.peakStart, "2026-01-16")
        XCTAssertEqual(window?.peakEnd, "2026-01-17")
        XCTAssertEqual(window?.end, "2026-01-18")
    }

    private func entry(
        _ date: String,
        _ temperature: Double,
        disturbed: Bool = false,
        excludeFromAnalysis: Bool = false
    ) -> TemperatureEntry {
        TemperatureEntry(
            id: UUID().uuidString,
            userId: "test-user",
            date: date,
            temperature: temperature,
            notes: nil,
            cervicalMucus: nil,
            measurementTime: nil,
            sleepHours: nil,
            disturbed: disturbed,
            disturbanceReason: nil,
            excludeFromAnalysis: excludeFromAnalysis,
            createdAt: nil,
            updatedAt: nil
        )
    }

    private func period(_ date: String, flowIntensity: FlowIntensity = .medium) -> PeriodEntry {
        PeriodEntry(
            id: UUID().uuidString,
            userId: "test-user",
            date: date,
            flowIntensity: flowIntensity,
            createdAt: nil
        )
    }
}
