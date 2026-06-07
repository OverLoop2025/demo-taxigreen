import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';

/**
 * Tema del conductor (claro/oscuro) coherente con el sistema.
 *
 * - Por defecto sigue la configuración del teléfono (`system`).
 * - El conductor puede forzar `light`/`dark` desde Perfil → Apariencia.
 * - La preferencia persiste en `expo-secure-store`.
 *
 * NativeWind aplica la clase `.dark` global según `colorScheme`, así que todas las
 * pantallas (que usan `bg-surface`, `text-foreground`, …) cambian a la vez: es
 * imposible que una quede clara y otra oscura.
 */
export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'tg-driver-theme';

type ThemeContextValue = {
  /** Preferencia elegida por el conductor (incluye `system`). */
  pref: ThemePref;
  /** Modo efectivo ya resuelto (`light` | `dark`). */
  resolved: 'light' | 'dark';
  setPref: (pref: ThemePref) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  // Restaura la preferencia guardada al arrancar (si no hay, sigue al sistema).
  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        const next: ThemePref =
          stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        setPrefState(next);
        setColorScheme(next);
      })
      .catch(() => {
        if (active) setColorScheme('system');
      });
    return () => {
      active = false;
    };
  }, [setColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      pref,
      resolved: colorScheme === 'dark' ? 'dark' : 'light',
      setPref: (next) => {
        setPrefState(next);
        setColorScheme(next);
        SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {
          /* almacenamiento no disponible: el tema vive sólo en memoria */
        });
      },
    }),
    [pref, colorScheme, setColorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePref(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePref debe usarse dentro de <ThemeProvider>');
  return ctx;
}
