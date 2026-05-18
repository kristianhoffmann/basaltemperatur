import StoreKit
import SwiftUI

struct PremiumPaywallView: View {
    @EnvironmentObject var supabase: SupabaseService
    @StateObject private var premiumStore = PremiumStore()

    let title: String
    let message: String
    var buttonTitle: String = "Analyse freischalten"

    private let upgradeURL = URL(string: "https://www.basaltemperatur.online/dashboard")!

    private var allowWebUpgradeLink: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "lock.shield")
                .font(.title2)
                .foregroundStyle(Color("AppPrimary"))

            Text(title)
                .font(.headline)
                .multilineTextAlignment(.center)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if let product = premiumStore.product {
                Button {
                    Task { await premiumStore.purchase(supabase: supabase) }
                } label: {
                    HStack {
                        if premiumStore.isPurchasing {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "cart.fill")
                            Text("\(buttonTitle) (\(product.displayPrice))")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [Color("AppPrimary"), Color("AppPrimaryLight")],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: RoundedRectangle(cornerRadius: 14)
                    )
                    .foregroundStyle(.white)
                }
                .disabled(premiumStore.isPurchasing)
            } else {
                VStack(spacing: 6) {
                    if premiumStore.isLoading {
                        ProgressView()
                    }
                    Text("Kaufoption wird geladen.")
                        .font(.footnote.weight(.semibold))
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.gray.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
            }

            Button {
                Task { await premiumStore.restore(supabase: supabase) }
            } label: {
                Label("Kauf wiederherstellen", systemImage: "arrow.clockwise")
                    .font(.footnote.weight(.semibold))
            }
            .disabled(premiumStore.isPurchasing)

            if allowWebUpgradeLink {
                Link(destination: upgradeURL) {
                    Text("Im Web freischalten")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color("AppPrimary"))
                }
            }

            if let successMessage = premiumStore.message {
                Text(successMessage)
                    .font(.caption)
                    .foregroundStyle(.green)
                    .multilineTextAlignment(.center)
            }

            if let errorMessage = premiumStore.errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .task {
            await premiumStore.loadProducts()
        }
    }
}

@MainActor
private final class PremiumStore: ObservableObject {
    private let lifetimeProductID = "de.basaltemperatur.lifetime"

    @Published var product: Product?
    @Published var isLoading = false
    @Published var isPurchasing = false
    @Published var message: String?
    @Published var errorMessage: String?

    func loadProducts() async {
        guard product == nil else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            let products = try await Product.products(for: [lifetimeProductID])
            product = products.first
            if product == nil {
                errorMessage = "Der In-App-Kauf ist noch nicht im Store verfügbar."
            }
        } catch {
            errorMessage = "Kaufoption konnte nicht geladen werden."
        }
    }

    func purchase(supabase: SupabaseService) async {
        if product == nil {
            await loadProducts()
        }
        guard let product else { return }

        isPurchasing = true
        message = nil
        errorMessage = nil
        defer { isPurchasing = false }

        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                let signedTransactionInfo = verification.jwsRepresentation
                let transaction = try checkVerified(verification)
                try await sync(signedTransactionInfo: signedTransactionInfo, supabase: supabase)
                await transaction.finish()
                message = "Vollzugang wurde freigeschaltet."
            case .userCancelled:
                break
            case .pending:
                message = "Der Kauf wartet noch auf Bestätigung."
            @unknown default:
                errorMessage = "Der Kauf konnte nicht abgeschlossen werden."
            }
        } catch {
            errorMessage = "Der Kauf konnte nicht verarbeitet werden."
        }
    }

    func restore(supabase: SupabaseService) async {
        isPurchasing = true
        message = nil
        errorMessage = nil
        defer { isPurchasing = false }

        do {
            try await AppStore.sync()
            var restored = false

            for await result in Transaction.currentEntitlements {
                let signedTransactionInfo = result.jwsRepresentation
                let transaction = try checkVerified(result)
                guard transaction.productID == lifetimeProductID,
                      transaction.revocationDate == nil else {
                    continue
                }
                try await sync(signedTransactionInfo: signedTransactionInfo, supabase: supabase)
                restored = true
            }

            message = restored ? "Kauf wurde wiederhergestellt." : "Kein aktiver Kauf gefunden."
        } catch {
            errorMessage = "Wiederherstellung fehlgeschlagen."
        }
    }

    private func sync(signedTransactionInfo: String, supabase: SupabaseService) async throws {
        try await supabase.syncAppStoreEntitlement(signedTransactionInfo: signedTransactionInfo)
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw SupabaseError.requestFailed
        case .verified(let value):
            return value
        }
    }
}
