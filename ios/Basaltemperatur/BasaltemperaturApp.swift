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

@main
struct BasaltemperaturApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
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
            .task {
                await authViewModel.checkSession(supabase: supabaseService)
            }
        }
    }
}
