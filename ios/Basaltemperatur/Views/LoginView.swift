// ios/Basaltemperatur/Views/LoginView.swift

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var supabase: SupabaseService
    
    @State private var email = ""
    @State private var password = ""
    @State private var isRegistering = false
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color("AppPrimary"), Color("AppPrimaryLight")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 80, height: 80)
                    
                    Text("🌡️")
                        .font(.system(size: 36))
                }
                
                Text("Basaltemperatur")
                    .font(.title.weight(.bold))
                
                Text("Dein Zyklustracker")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            // Form
            VStack(spacing: 16) {
                TextField("E-Mail", text: $email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                
                SecureField("Passwort", text: $password)
                    .textContentType(isRegistering ? .newPassword : .password)
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                
                if let error = authViewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
                
                Button {
                    Task {
                        if isRegistering {
                            await authViewModel.signUp(email: email, password: password, supabase: supabase)
                        } else {
                            await authViewModel.signIn(email: email, password: password, supabase: supabase)
                        }
                    }
                } label: {
                    HStack {
                        if authViewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isRegistering ? "Registrieren" : "Anmelden")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color("AppPrimary"), in: RoundedRectangle(cornerRadius: 16))
                    .foregroundStyle(.white)
                }
                .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)
            }
            .padding(.horizontal)
            
            // Toggle
            Button {
                withAnimation { isRegistering.toggle() }
            } label: {
                Text(isRegistering ? "Schon ein Konto? Anmelden" : "Noch kein Konto? Registrieren")
                    .font(.subheadline)
                    .foregroundStyle(Color("AppPrimary"))
            }
            
            Spacer()
            
            Text("Einmalig 9,99 € · Lebenslanger Zugang")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }
}
