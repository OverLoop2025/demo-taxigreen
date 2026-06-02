import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/features/api/client';
import type { DriverProfile, DriverSession, LoginResponse } from './types';

type AuthStatus = 'hydrating' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: AuthStatus;
  session: DriverSession | null;
  conductor: DriverProfile | null;
  login: (email: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
};

const storageKey = 'taxigreen.driver.session.v1';
const AuthContext = createContext<AuthContextValue | null>(null);

const sessionSchema = z.object({
  token: z.string().min(16),
  expiresAt: z.number(),
  conductor: z.object({
    userId: z.string(),
    conductorId: z.string(),
    tenantId: z.string(),
    nombre: z.string(),
    email: z.string(),
    telefono: z.string().nullable(),
    licencia: z.string(),
    rating: z.number(),
    totalViajes: z.number(),
    vehiculo: z
      .object({
        id: z.string(),
        placa: z.string(),
        marca: z.string(),
        modelo: z.string(),
        tipo: z.string(),
        capacidad: z.number(),
        color: z.string().nullable(),
        anio: z.number().nullable(),
      })
      .nullable(),
  }),
});

async function persistSession(session: DriverSession) {
  await SecureStore.setItemAsync(storageKey, JSON.stringify(session));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(storageKey);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('hydrating');
  const [session, setSession] = useState<DriverSession | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const raw = await SecureStore.getItemAsync(storageKey);
      const parsed = raw ? sessionSchema.safeParse(JSON.parse(raw)) : null;
      if (!mounted) return;

      if (parsed?.success && parsed.data.expiresAt > Date.now()) {
        setSession(parsed.data);
        setStatus('authenticated');
        return;
      }

      if (raw) await clearSession();
      setSession(null);
      setStatus('anonymous');
    }

    hydrate().catch(() => {
      if (!mounted) return;
      setSession(null);
      setStatus('anonymous');
    });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, pin: string) => {
    const response = await apiFetch<LoginResponse>('/api/conductor/login', {
      method: 'POST',
      body: { email, pin },
    });
    const nextSession: DriverSession = {
      token: response.token,
      expiresAt: Date.now() + response.expiresIn * 1000,
      conductor: response.conductor,
    };

    await persistSession(nextSession);
    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      conductor: session?.conductor ?? null,
      login,
      logout,
    }),
    [login, logout, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
