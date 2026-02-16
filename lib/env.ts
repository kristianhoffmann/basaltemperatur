// ============================================================================
// ENVIRONMENT VALIDATION
// Validiert Umgebungsvariablen beim Start
// ============================================================================

import { z } from 'zod';

// Server-seitige Umgebungsvariablen
const serverSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Stripe (optional in dev)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
  
  // AI (optional)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Client-seitige Umgebungsvariablen (NEXT_PUBLIC_*)
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // App Config
  NEXT_PUBLIC_APP_NAME: z.string().default('SaaS App'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_AI: z.string().transform((v) => v === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform((v) => v === 'true').default('true'),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/**
 * Validiert Server-Umgebungsvariablen
 */
export function validateServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }
  
  return parsed.data;
}

/**
 * Validiert Client-Umgebungsvariablen
 */
export function validateClientEnv(): ClientEnv {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ENABLE_AI: process.env.NEXT_PUBLIC_ENABLE_AI,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  };
  
  const parsed = clientSchema.safeParse(clientEnv);
  
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }
  
  return parsed.data;
}

// ============================================================================
// SINGLETON PATTERN
// ============================================================================

let serverEnv: ServerEnv | null = null;
let clientEnv: ClientEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!serverEnv) {
    serverEnv = validateServerEnv();
  }
  return serverEnv;
}

export function getClientEnv(): ClientEnv {
  if (!clientEnv) {
    clientEnv = validateClientEnv();
  }
  return clientEnv;
}

// ============================================================================
// TYPE-SAFE ENV ACCESS
// ============================================================================

export const env = {
  get server() {
    return getServerEnv();
  },
  get client() {
    return getClientEnv();
  },
};
