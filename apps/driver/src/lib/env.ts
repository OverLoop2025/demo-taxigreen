import { z } from 'zod';

/**
 * Variables de entorno tipadas (apps/driver). En Expo, las variables expuestas
 * al bundle usan prefijo EXPO_PUBLIC_. Sprint 0: opcionales con defaults seguros.
 */
const schema = z.object({
  EXPO_PUBLIC_API_URL: z.string().default('http://localhost:3000'),
  EXPO_PUBLIC_SUPABASE_URL: z.string().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  EXPO_PUBLIC_EXPO_PROJECT_ID: z.string().optional(),
  EXPO_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

export const env = schema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_EXPO_PROJECT_ID: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
  EXPO_PUBLIC_MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
});

export type Env = z.infer<typeof schema>;
