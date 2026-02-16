// ios/Basaltemperatur/Views/MainTabView.swift

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
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
            
            EntryView()
                .tabItem {
                    Image(systemName: "plus.circle.fill")
                    Text("Eintrag")
                }
                .tag(2)
            
            StatisticsView()
                .tabItem {
                    Image(systemName: "chart.bar")
                    Text("Statistiken")
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
    }
}
