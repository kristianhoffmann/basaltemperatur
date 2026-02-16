// lib/supabase/index.ts
// Barrel Export für Supabase Clients
//
// Verwendung:
// import { createClient } from '@/lib/supabase/client' (Browser)
// import { createClient, createAdminClient } from '@/lib/supabase/server' (Server)

// HINWEIS: Nicht als gemeinsamer Export, da Client und Server
// unterschiedliche Kontexte haben. Importiere direkt:
//
// Client Components:
// import { createClient } from '@/lib/supabase/client'
//
// Server Components / Server Actions:
// import { createClient, createAdminClient } from '@/lib/supabase/server'

export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient, createAdminClient } from './server'
