import { z } from 'zod';

/**
 * Variables de entorno tipadas con Zod (apps/web).
 *
 * En Sprint 0 todo es opcional para que `next build` y `tsc` no fallen sin
 * secretos. En sprints posteriores, las variables que un feature necesite pasan
 * a requeridas (y se valida en runtime del servidor).
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  IA_HABILITADA: z.enum(['true', 'false']).default('false'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL_EXTRACCION: z.string().default('claude-sonnet-4-6'),
  ANTHROPIC_MODEL_RAPIDO: z.string().default('claude-haiku-4-5-20251001'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  HMAC_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RENIEC_API_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  // Públicas (se inlinean por Next; referenciar literalmente).
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

export const env = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  IA_HABILITADA: process.env.IA_HABILITADA,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL_EXTRACCION: process.env.ANTHROPIC_MODEL_EXTRACCION,
  ANTHROPIC_MODEL_RAPIDO: process.env.ANTHROPIC_MODEL_RAPIDO,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  HMAC_SECRET: process.env.HMAC_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RENIEC_API_TOKEN: process.env.RENIEC_API_TOKEN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
});

export type Env = z.infer<typeof schema>;
