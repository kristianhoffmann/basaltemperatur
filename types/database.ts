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
          entitlement_source: 'none' | 'stripe' | 'app_store' | 'manual'
          lifetime_access_granted_at: string | null
          app_store_original_transaction_id: string | null
          app_store_product_id: string | null
          onboarding_completed: boolean
          sensitive_data_consent_at: string | null
          sensitive_data_consent_version: string | null
          intended_use_acknowledged_at: string | null
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
          entitlement_source?: 'none' | 'stripe' | 'app_store' | 'manual'
          lifetime_access_granted_at?: string | null
          app_store_original_transaction_id?: string | null
          app_store_product_id?: string | null
          onboarding_completed?: boolean
          sensitive_data_consent_at?: string | null
          sensitive_data_consent_version?: string | null
          intended_use_acknowledged_at?: string | null
        }
        Update: {
          display_name?: string | null
          cycle_length_default?: number
          luteal_phase_default?: number
          temperature_unit?: 'celsius' | 'fahrenheit'
          has_lifetime_access?: boolean
          entitlement_source?: 'none' | 'stripe' | 'app_store' | 'manual'
          lifetime_access_granted_at?: string | null
          app_store_original_transaction_id?: string | null
          app_store_product_id?: string | null
          onboarding_completed?: boolean
          sensitive_data_consent_at?: string | null
          sensitive_data_consent_version?: string | null
          intended_use_acknowledged_at?: string | null
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
          measurement_time: string | null
          sleep_hours: number | null
          disturbed: boolean
          disturbance_reason: string | null
          exclude_from_analysis: boolean
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
          measurement_time?: string | null
          sleep_hours?: number | null
          disturbed?: boolean
          disturbance_reason?: string | null
          exclude_from_analysis?: boolean
        }
        Update: {
          date?: string
          temperature?: number
          notes?: string | null
          cervical_mucus?: CervicalMucusType | null
          measurement_time?: string | null
          sleep_hours?: number | null
          disturbed?: boolean
          disturbance_reason?: string | null
          exclude_from_analysis?: boolean
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
      traffic_events: {
        Row: {
          id: string
          created_at: string
          event_type: 'pageview' | 'conversion' | 'custom'
          visitor_id: string
          session_id: string
          user_id: string | null
          is_admin: boolean
          path: string
          full_url: string | null
          query_string: string | null
          title: string | null
          referrer: string | null
          referrer_host: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          language: string | null
          timezone: string | null
          viewport_width: number | null
          viewport_height: number | null
          screen_width: number | null
          screen_height: number | null
          color_scheme: 'light' | 'dark' | null
          connection_type: string | null
          user_agent: string | null
          browser: string | null
          os: string | null
          device_type: 'desktop' | 'mobile' | 'tablet' | null
          is_bot: boolean
          bot_name: string | null
          ip_hash: string | null
          country: string | null
          region: string | null
          city: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          event_type?: 'pageview' | 'conversion' | 'custom'
          visitor_id: string
          session_id: string
          user_id?: string | null
          is_admin?: boolean
          path: string
          full_url?: string | null
          query_string?: string | null
          title?: string | null
          referrer?: string | null
          referrer_host?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          language?: string | null
          timezone?: string | null
          viewport_width?: number | null
          viewport_height?: number | null
          screen_width?: number | null
          screen_height?: number | null
          color_scheme?: 'light' | 'dark' | null
          connection_type?: string | null
          user_agent?: string | null
          browser?: string | null
          os?: string | null
          device_type?: 'desktop' | 'mobile' | 'tablet' | null
          is_bot?: boolean
          bot_name?: string | null
          ip_hash?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          metadata?: Json
        }
        Update: {
          event_type?: 'pageview' | 'conversion' | 'custom'
          visitor_id?: string
          session_id?: string
          user_id?: string | null
          is_admin?: boolean
          path?: string
          full_url?: string | null
          query_string?: string | null
          title?: string | null
          referrer?: string | null
          referrer_host?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          language?: string | null
          timezone?: string | null
          viewport_width?: number | null
          viewport_height?: number | null
          screen_width?: number | null
          screen_height?: number | null
          color_scheme?: 'light' | 'dark' | null
          connection_type?: string | null
          user_agent?: string | null
          browser?: string | null
          os?: string | null
          device_type?: 'desktop' | 'mobile' | 'tablet' | null
          is_bot?: boolean
          bot_name?: string | null
          ip_hash?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          metadata?: Json
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
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
export type TrafficEvent = Tables<'traffic_events'>
