// ios/Basaltemperatur/Views/MainTabView.swift

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var showGuideSheet = false
    @AppStorage("hasSeenGuide") private var hasSeenGuide = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "chart.xyaxis.line")
                    Text("Dashboard")
                }
                .tag(0)
            
            CalendarTabView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Kalender")
                }
                .tag(1)
            
            AppGuideView()
                .tabItem {
                    Image(systemName: "book.closed")
                    Text("Anleitung")
                }
                .tag(2)

            EntryView()
                .tabItem {
                    Image(systemName: "plus.circle.fill")
                    Text("Eintrag")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape")
                    Text("Mehr")
                }
                .tag(4)
        }
        .tint(Color("AppPrimary"))
        .onAppear {
            if !hasSeenGuide {
                showGuideSheet = true
            }
        }
        .sheet(isPresented: $showGuideSheet, onDismiss: {
            hasSeenGuide = true
        }) {
            NavigationStack {
                AppGuideView()
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Fertig") {
                                showGuideSheet = false
                                hasSeenGuide = true
                            }
                        }
                    }
            }
        }
    }
}
