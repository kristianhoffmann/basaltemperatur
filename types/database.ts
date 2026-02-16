// types/database.ts
// Basaltemperatur App – Supabase Types

export type CervicalMucusType = 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggwhite'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          cycle_length_default: number
          luteal_phase_default: number
          temperature_unit: 'celsius' | 'fahrenheit'
          has_lifetime_access: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          cycle_length_default?: number
          luteal_phase_default?: number
          temperature_unit?: 'celsius' | 'fahrenheit'
          has_lifetime_access?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          display_name?: string | null
          cycle_length_default?: number
          luteal_phase_default?: number
          temperature_unit?: 'celsius' | 'fahrenheit'
          has_lifetime_access?: boolean
          onboarding_completed?: boolean
        }
      }
      temperature_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          temperature: number
          notes: string | null
          cervical_mucus: CervicalMucusType | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          temperature: number
          notes?: string | null
          cervical_mucus?: CervicalMucusType | null
        }
        Update: {
          date?: string
          temperature?: number
          notes?: string | null
          cervical_mucus?: CervicalMucusType | null
        }
      }
      period_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          flow_intensity: 'light' | 'medium' | 'heavy' | 'spotting'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          flow_intensity?: 'light' | 'medium' | 'heavy' | 'spotting'
        }
        Update: {
          date?: string
          flow_intensity?: 'light' | 'medium' | 'heavy' | 'spotting'
        }
      }
      cycles: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string | null
          ovulation_date: string | null
          cycle_length: number | null
          cover_line_temp: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date?: string | null
          ovulation_date?: string | null
          cycle_length?: number | null
          cover_line_temp?: number | null
        }
        Update: {
          start_date?: string
          end_date?: string | null
          ovulation_date?: string | null
          cycle_length?: number | null
          cover_line_temp?: number | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      flow_intensity: 'light' | 'medium' | 'heavy' | 'spotting'
      temperature_unit: 'celsius' | 'fahrenheit'
      cervical_mucus: 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggwhite'
    }
  }
}

// Helper Types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience Types
export type Profile = Tables<'profiles'>
export type TemperatureEntry = Tables<'temperature_entries'>
export type PeriodEntry = Tables<'period_entries'>
export type Cycle = Tables<'cycles'>
