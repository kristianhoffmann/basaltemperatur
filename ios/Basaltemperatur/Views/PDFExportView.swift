// ios/Basaltemperatur/Views/PDFExportView.swift
// PDF-Export – Identisch zum Web-Export via WKWebView HTML-Rendering

import SwiftUI
import WebKit

struct PDFExportView: View {
    @EnvironmentObject var supabase: SupabaseService
    @StateObject private var viewModel = DashboardViewModel()
    
    @State private var isGenerating = false
    @State private var showShareSheet = false
    @State private var pdfData: Data?
    @State private var errorMessage: String?
    
    // Last 90 days of entries
    private var recentEntries: [TemperatureEntry] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let cutoffStr = formatISO(cutoff)
        return viewModel.entries.filter { $0.date >= cutoffStr }.sorted { $0.date < $1.date }
    }
    
    private var recentPeriods: [PeriodEntry] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let cutoffStr = formatISO(cutoff)
        return viewModel.periodEntries.filter { $0.date >= cutoffStr }.sorted { $0.date < $1.date }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "doc.richtext")
                        .font(.system(size: 44))
                        .foregroundStyle(Color("AppPrimary"))
                    
                    Text("Zykluskurve exportieren")
                        .font(.title2.weight(.bold))
                    
                    Text("Erstelle ein PDF für deinen Frauenarzt mit Temperaturkurve und Perioden.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                .padding(.top, 12)
                
                // Stats Preview
                if !recentEntries.isEmpty {
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                    ], spacing: 12) {
                        PDFStatCard(label: "Einträge", value: "\(recentEntries.count)")
                        PDFStatCard(label: "Periode-Tage", value: "\(recentPeriods.count)")
                        
                        let temps = recentEntries.map { $0.temperature }
                        let avg = temps.reduce(0, +) / Double(temps.count)
                        PDFStatCard(label: "⌀ Temp", value: String(format: "%.2f°", avg))
                    }
                    .padding(.horizontal)
                    
                    // Date Range
                    if let first = recentEntries.first, let last = recentEntries.last {
                        HStack(spacing: 6) {
                            Image(systemName: "calendar")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(formatDateGerman(first.date)) – \(formatDateGerman(last.date))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    Text("Letzte 90 Tage")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                
                // Error
                if let error = errorMessage {
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                }
                
                // Export Button
                Button {
                    Task { await generatePDF() }
                } label: {
                    HStack(spacing: 8) {
                        if isGenerating {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "square.and.arrow.up")
                        }
                        Text(isGenerating ? "PDF wird erstellt..." : "PDF erstellen & teilen")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [Color("AppPrimary"), Color("AppPrimaryLight")],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: RoundedRectangle(cornerRadius: 16)
                    )
                    .foregroundStyle(.white)
                }
                .disabled(recentEntries.isEmpty || isGenerating)
                .opacity(recentEntries.isEmpty ? 0.5 : 1)
                .padding(.horizontal)
                
                // Disclaimer
                Text("Hinweis: Diese Kurve dient der Unterstützung des Arztgesprächs und ersetzt keine medizinische Diagnose.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                    .padding(.bottom, 20)
            }
        }
        .navigationTitle("PDF-Export")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadData(supabase: supabase)
        }
        .sheet(isPresented: $showShareSheet) {
            if let data = pdfData {
                PDFShareSheet(activityItems: [data])
            }
        }
    }
    
    private func generatePDF() async {
        isGenerating = true
        errorMessage = nil
        
        let entries = recentEntries
        let periods = recentPeriods
        
        guard !entries.isEmpty else {
            errorMessage = "Keine Daten vorhanden."
            isGenerating = false
            return
        }
        
        let html = PDFHTMLBuilder.buildHTML(entries: entries, periodEntries: periods)
        
        do {
            let data = try await WebViewPDFRenderer.renderPDF(html: html)
            self.pdfData = data
            self.showShareSheet = true
        } catch {
            self.errorMessage = "PDF konnte nicht erstellt werden: \(error.localizedDescription)"
        }
        
        isGenerating = false
    }
    
    private func formatDateGerman(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateStr) else { return dateStr }
        formatter.dateFormat = "d. MMM yyyy"
        formatter.locale = Locale(identifier: "de_DE")
        return formatter.string(from: date)
    }
    
    private func formatISO(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}

// MARK: - Stat Card

private struct PDFStatCard: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline.weight(.bold))
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Share Sheet

private struct PDFShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - WKWebView PDF Renderer

@MainActor
class WebViewPDFRenderer: NSObject, WKNavigationDelegate {
    private var webView: WKWebView?
    private var continuation: CheckedContinuation<Data, Error>?
    
    static func renderPDF(html: String) async throws -> Data {
        let renderer = WebViewPDFRenderer()
        return try await renderer.render(html: html)
    }
    
    private func render(html: String) async throws -> Data {
        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            
            let config = WKWebViewConfiguration()
            let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 1123, height: 794), configuration: config) // A4 landscape at 96dpi
            webView.navigationDelegate = self
            self.webView = webView
            
            webView.loadHTMLString(html, baseURL: nil)
        }
    }
    
    nonisolated func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task { @MainActor in
            // Small delay to ensure rendering is complete
            try? await Task.sleep(nanoseconds: 300_000_000)
            
            let config = WKPDFConfiguration()
            // A4 landscape: 297mm x 210mm
            config.rect = CGRect(x: 0, y: 0, width: 842, height: 595)
            
            do {
                let data = try await webView.pdf(configuration: config)
                self.continuation?.resume(returning: data)
            } catch {
                self.continuation?.resume(throwing: error)
            }
            self.continuation = nil
            self.webView = nil
        }
    }
    
    nonisolated func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        Task { @MainActor in
            self.continuation?.resume(throwing: error)
            self.continuation = nil
            self.webView = nil
        }
    }
}

// MARK: - HTML Builder (mirrors web ExportClient.tsx exactly)

struct PDFHTMLBuilder {
    
    static func buildHTML(entries: [TemperatureEntry], periodEntries: [PeriodEntry]) -> String {
        let periodSet = Set(periodEntries.map { $0.date })
        let periodFlowMap = Dictionary(uniqueKeysWithValues: periodEntries.map { ($0.date, $0.flowIntensity.rawValue) })
        
        // Ovulation detection
        let ovulations = OvulationCalculator.detectAllOvulations(entries: entries)
        let ovulationDates = Set(ovulations.compactMap { $0.ovulationDate })
        let coverLine: Double? = ovulations.last(where: { $0.coverLineTemp != nil })?.coverLineTemp
        
        let temps = entries.map { $0.temperature }
        let avgTemp = temps.reduce(0, +) / Double(max(temps.count, 1))
        let minTemp = (temps.min().map { floor($0 * 10) / 10 - 0.1 }) ?? 36.0
        let maxTemp = (temps.max().map { ceil($0 * 10) / 10 + 0.1 }) ?? 37.5
        
        // Chart dimensions (same as web)
        let width: Double = 760
        let height: Double = 300
        let padTop: Double = 25, padRight: Double = 25, padBottom: Double = 40, padLeft: Double = 50
        let chartW = width - padLeft - padRight
        let chartH = height - padTop - padBottom
        
        func xScale(_ i: Int) -> Double { padLeft + (Double(i) / Double(max(entries.count - 1, 1))) * chartW }
        func yScale(_ t: Double) -> Double { padTop + chartH - ((t - minTemp) / (maxTemp - minTemp)) * chartH }
        
        // Y ticks
        var yTicks: [Double] = []
        var tick = minTemp
        while tick <= maxTemp { yTicks.append((tick * 10).rounded() / 10); tick += 0.1 }
        
        let labelEvery = entries.count <= 20 ? 2 : entries.count <= 40 ? 3 : entries.count <= 60 ? 5 : 7
        
        // Path data
        let pathData = entries.enumerated().map { (i, e) in
            "\(i == 0 ? "M" : "L") \(xScale(i)) \(yScale(e.temperature))"
        }.joined(separator: " ")
        
        // Date formatting
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let displayDF = DateFormatter()
        displayDF.dateFormat = "d. MMMM yyyy"
        displayDF.locale = Locale(identifier: "de_DE")
        let shortDF = DateFormatter()
        shortDF.dateFormat = "d. MMM"
        shortDF.locale = Locale(identifier: "de_DE")
        let dayMonthDF = DateFormatter()
        dayMonthDF.dateFormat = "d.M."
        let tableDateDF = DateFormatter()
        tableDateDF.dateFormat = "dd.MM.yyyy"
        let weekdayDF = DateFormatter()
        weekdayDF.dateFormat = "EEE"
        weekdayDF.locale = Locale(identifier: "de_DE")
        let todayStr = displayDF.string(from: Date())
        
        let dateRange: String = {
            guard let first = entries.first, let last = entries.last,
                  let d1 = df.date(from: first.date), let d2 = df.date(from: last.date) else { return "Keine Daten" }
            return "\(displayDF.string(from: d1)) – \(displayDF.string(from: d2))"
        }()
        
        // Ovulation dates formatted
        let ovulationDateStrs = ovulations.compactMap { ov -> String? in
            guard let d = ov.ovulationDate, let date = df.date(from: d) else { return nil }
            return shortDF.string(from: date)
        }
        let ovulationLabel = ovulationDates.count == 1 ? "Eisprung erkannt" : "Eisprünge erkannt"
        let ovulationValue = ovulationDateStrs.isEmpty ? "–" : ovulationDateStrs.joined(separator: ", ")
        
        // Build SVG elements
        var svgElements = ""
        
        // Grid lines
        for t in yTicks {
            let y = yScale(t)
            let isWhole = abs(t - t.rounded()) < 0.05
            svgElements += "<line x1=\"\(padLeft)\" y1=\"\(y)\" x2=\"\(width - padRight)\" y2=\"\(y)\" stroke=\"\(isWhole ? "#e5e7eb" : "#f3f4f6")\" stroke-width=\"\(isWhole ? 0.8 : 0.4)\"/>"
            svgElements += "<text x=\"\(padLeft - 8)\" y=\"\(y + 3.5)\" text-anchor=\"end\" font-size=\"9\" fill=\"#9ca3af\" font-family=\"system-ui\">\(String(format: "%.1f", t))</text>"
        }
        
        // Period bands
        for (i, entry) in entries.enumerated() {
            if periodSet.contains(entry.date) {
                let x = xScale(i) - (chartW / Double(entries.count)) / 2
                let w = max(chartW / Double(entries.count), 6)
                svgElements += "<rect x=\"\(x)\" y=\"\(padTop)\" width=\"\(w)\" height=\"\(chartH)\" fill=\"#E8788A\" opacity=\"0.08\"/>"
            }
        }
        
        // Cover line
        if let cl = coverLine {
            let y = yScale(cl)
            svgElements += "<line x1=\"\(padLeft)\" y1=\"\(y)\" x2=\"\(width - padRight)\" y2=\"\(y)\" stroke=\"#E8788A\" stroke-width=\"1\" stroke-dasharray=\"8,4\" opacity=\"0.6\"/>"
            svgElements += "<text x=\"\(width - padRight + 2)\" y=\"\(y + 3)\" font-size=\"8\" fill=\"#E8788A\" font-family=\"system-ui\">\(String(format: "%.2f", cl))°</text>"
        }
        
        // Gradient fill
        if entries.count > 1 {
            svgElements += "<defs><linearGradient id=\"tempGrad\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#E8788A\" stop-opacity=\"0.4\"/><stop offset=\"100%\" stop-color=\"#E8788A\" stop-opacity=\"0\"/></linearGradient></defs>"
            svgElements += "<path d=\"\(pathData) L \(xScale(entries.count - 1)) \(yScale(minTemp)) L \(xScale(0)) \(yScale(minTemp)) Z\" fill=\"url(#tempGrad)\" opacity=\"0.3\"/>"
        }
        
        // Temperature line
        svgElements += "<path d=\"\(pathData)\" fill=\"none\" stroke=\"#E8788A\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
        
        // Data points
        for (i, entry) in entries.enumerated() {
            let cx = xScale(i)
            let cy = yScale(entry.temperature)
            let isOv = ovulationDates.contains(entry.date)
            let isPeriod = periodSet.contains(entry.date)
            let r: Double = isOv ? 5 : 3
            let fill = isOv ? "#8B5CF6" : isPeriod ? "#E8788A" : "#fff"
            let stroke = isOv ? "#8B5CF6" : "#E8788A"
            let sw: Double = isOv ? 2 : 1.5
            svgElements += "<circle cx=\"\(cx)\" cy=\"\(cy)\" r=\"\(r)\" fill=\"\(fill)\" stroke=\"\(stroke)\" stroke-width=\"\(sw)\"/>"
            if isOv {
                svgElements += "<text x=\"\(cx)\" y=\"\(cy - 10)\" text-anchor=\"middle\" font-size=\"8\" fill=\"#8B5CF6\" font-weight=\"600\" font-family=\"system-ui\">Eisprung</text>"
            }
        }
        
        // X-axis labels
        for (i, entry) in entries.enumerated() {
            guard i % labelEvery == 0, let d = df.date(from: entry.date) else { continue }
            svgElements += "<text x=\"\(xScale(i))\" y=\"\(height - 12)\" text-anchor=\"middle\" font-size=\"8\" fill=\"#9ca3af\" font-family=\"system-ui\">\(dayMonthDF.string(from: d))</text>"
        }
        
        // Period dots at bottom
        for (i, entry) in entries.enumerated() {
            if periodSet.contains(entry.date) {
                svgElements += "<circle cx=\"\(xScale(i))\" cy=\"\(height - 4)\" r=\"2.5\" fill=\"#E8788A\"/>"
            }
        }
        
        // Build table rows
        var tableRows = ""
        for entry in entries {
            let isOv = ovulationDates.contains(entry.date)
            let isPeriod = periodSet.contains(entry.date)
            let bg = isOv ? "#f5f3ff" : isPeriod ? "#fef2f4" : "transparent"
            let flow = periodFlowMap[entry.date]
            let flowStr: String = {
                guard isPeriod else { return "–" }
                switch flow {
                case "heavy": return "<span style='color:#E8788A'>●●●</span>"
                case "medium": return "<span style='color:#E8788A'>●●</span>"
                case "light": return "<span style='color:#E8788A'>●</span>"
                case "spotting": return "<span style='color:#E8788A'>·</span>"
                default: return "<span style='color:#E8788A'>●</span>"
                }
            }()
            
            guard let d = df.date(from: entry.date) else { continue }
            let tempColor = isOv ? "#7c3aed" : "#111827"
            let tempSuffix = isOv ? " ●" : ""
            let notes = (entry.notes ?? "–").replacingOccurrences(of: "<", with: "&lt;")
            
            tableRows += """
            <tr style="border-bottom:1px solid #f3f4f6;background:\(bg)">
                <td style="padding:6px 10px;font-weight:500;color:#111827">\(tableDateDF.string(from: d))</td>
                <td style="padding:6px 10px;color:#6b7280">\(weekdayDF.string(from: d))</td>
                <td style="padding:6px 10px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums;color:\(tempColor)">\(String(format: "%.2f", entry.temperature))\(tempSuffix)</td>
                <td style="padding:6px 10px;text-align:center">\(flowStr)</td>
                <td style="padding:6px 10px;color:#6b7280">\(notes)</td>
            </tr>
            """
        }
        
        // Cover line / Hilfslinie stat
        let coverLineStat = coverLine != nil ? """
        <div style="padding:8px 14px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Hilfslinie</div>
            <div style="font-size:14px;font-weight:600;color:#111827">\(String(format: "%.2f°C", coverLine!))</div>
        </div>
        """ : ""
        
        let coverLineLegend = coverLine != nil ? """
        <span style="display:flex;align-items:center;gap:4px">
            <span style="width:16px;height:0;border-top:1px dashed #E8788A;display:inline-block"></span>
            Hilfslinie (\(String(format: "%.2f°C", coverLine!)))
        </span>
        """ : ""
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=1123">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, system-ui, sans-serif; background: white; color: #111827; }
            @page { size: A4 landscape; margin: 0; }
        </style>
        </head>
        <body>
        <div style="overflow:hidden">
            <!-- Header -->
            <div style="background:linear-gradient(135deg, #E8788A 0%, #D4566A 100%);padding:24px 32px;color:white">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div>
                        <h2 style="font-size:20px;font-weight:700;margin:0;letter-spacing:-0.02em">Basaltemperaturkurve</h2>
                        <p style="font-size:13px;opacity:0.85;margin-top:4px">\(dateRange)</p>
                    </div>
                    <div style="text-align:right;font-size:11px;opacity:0.75">
                        <div>Erstellt: \(todayStr)</div>
                        <div style="margin-top:2px">basaltemperatur.app</div>
                    </div>
                </div>
            </div>
        
            <div style="padding:24px 32px">
                <!-- Stats -->
                <div style="display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap">
                    <div style="padding:8px 14px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0">
                        <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Einträge</div>
                        <div style="font-size:14px;font-weight:600;color:#111827">\(entries.count)</div>
                    </div>
                    <div style="padding:8px 14px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0">
                        <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">⌀ Temperatur</div>
                        <div style="font-size:14px;font-weight:600;color:#111827">\(String(format: "%.2f°C", avgTemp))</div>
                    </div>
                    \(coverLineStat)
                    <div style="padding:8px 14px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0">
                        <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">\(ovulationLabel)</div>
                        <div style="font-size:14px;font-weight:600;color:#111827">\(ovulationValue)</div>
                    </div>
                    <div style="padding:8px 14px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0">
                        <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Periode-Tage</div>
                        <div style="font-size:14px;font-weight:600;color:#111827">\(periodEntries.count)</div>
                    </div>
                </div>
        
                <!-- Chart -->
                <div style="border:1px solid #f0f0f0;border-radius:12px;padding:12px 8px 4px 8px;margin-bottom:24px;background:#fafafa">
                    <svg viewBox="0 0 \(Int(width)) \(Int(height))" style="width:100%;display:block">
                        \(svgElements)
                    </svg>
                    <div style="display:flex;gap:16px;justify-content:center;padding:8px 0 4px 0;font-size:10px;color:#9ca3af">
                        <span style="display:flex;align-items:center;gap:4px">
                            <span style="width:8px;height:8px;border-radius:50%;background:#E8788A;display:inline-block"></span>
                            Temperatur
                        </span>
                        \(coverLineLegend)
                        <span style="display:flex;align-items:center;gap:4px">
                            <span style="width:8px;height:8px;border-radius:50%;background:#8B5CF6;display:inline-block"></span>
                            Eisprung (\(ovulationDates.count))
                        </span>
                        <span style="display:flex;align-items:center;gap:4px">
                            <span style="width:8px;height:8px;border-radius:50%;background:#E8788A;opacity:0.3;display:inline-block"></span>
                            Periode
                        </span>
                    </div>
                </div>
        
                <!-- Table -->
                <table style="width:100%;border-collapse:collapse;font-size:11px;font-family:system-ui,-apple-system,sans-serif">
                    <thead>
                        <tr style="border-bottom:2px solid #e5e7eb">
                            <th style="padding:8px 10px;font-weight:600;color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;text-align:left">Datum</th>
                            <th style="padding:8px 10px;font-weight:600;color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;text-align:left">Tag</th>
                            <th style="padding:8px 10px;font-weight:600;color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;text-align:center">Temp. (°C)</th>
                            <th style="padding:8px 10px;font-weight:600;color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;text-align:center">Periode</th>
                            <th style="padding:8px 10px;font-weight:600;color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;text-align:left">Notizen</th>
                        </tr>
                    </thead>
                    <tbody>
                        \(tableRows)
                    </tbody>
                </table>
            </div>
        
            <!-- Footer -->
            <div style="padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af;background:#fafafa">
                <span>Erstellt am \(todayStr) • basaltemperatur.app</span>
                <span>Hinweis: Diese Kurve dient der Unterstützung des Arztgesprächs und ersetzt keine medizinische Diagnose.</span>
            </div>
        </div>
        </body>
        </html>
        """
    }
}
