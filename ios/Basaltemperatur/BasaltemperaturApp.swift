// ios/Basaltemperatur/BasaltemperaturApp.swift
// Main App entry point

import SwiftUI

// Global orientation lock controller
class OrientationManager: ObservableObject {
    static let shared = OrientationManager()
    
    @Published var allowLandscape = false
    
    var supportedOrientations: UIInterfaceOrientationMask {
        allowLandscape ? .allButUpsideDown : .portrait
    }
}

// AppDelegate to control orientations per-view
class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return OrientationManager.shared.supportedOrientations
    }
}

// UIHostingController subclass that explicitly declares landscape support.
// Needed for iOS 16+ where fullScreenCover's hosting controller no longer
// automatically delegates supportedInterfaceOrientations to the AppDelegate.
final class LandscapeHostingController<Content: View>: UIHostingController<Content> {
    var onDismiss: (() -> Void)?

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .landscapeRight }
    override var shouldAutorotate: Bool { true }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if isBeingDismissed { onDismiss?() }
    }
}

@main
struct BasaltemperaturApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var supabaseService = SupabaseService()
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authViewModel.isAuthenticated {
                    MainTabView()
                        .environmentObject(authViewModel)
                        .environmentObject(supabaseService)
                } else {
                    LoginView()
                        .environmentObject(authViewModel)
                        .environmentObject(supabaseService)
                }
            }
            .preferredColorScheme(.dark)
            .task {
                await authViewModel.checkSession(supabase: supabaseService)
            }
            .onChange(of: scenePhase) { _, newPhase in
                guard newPhase == .active else { return }
                Task {
                    await authViewModel.checkSession(supabase: supabaseService)
                }
            }
        }
    }
}
