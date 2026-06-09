import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, View } from 'react-native';
import { useColorScheme, vars } from 'nativewind';
import * as SecureStore from 'expo-secure-store';

/**
 * Tema del conductor (claro/oscuro) coherente con el sistema.
 *
 * - Por defecto sigue la configuración del teléfono (`system`) vía `Appearance`.
 * - El conductor puede forzar `light`/`dark` desde Perfil → Apariencia.
 * - La preferencia persiste en `expo-secure-store`.
 *
 * FUENTE DE VERDAD = `resolved`, calculado aquí desde `pref` + `Appearance` de
 * React Native (que SÍ reporta el modo del sistema). No dependemos del
 * `colorScheme` de NativeWind: con `darkMode:'class'` el modo `system` no consulta
 * Appearance de forma fiable y dejaba todo en claro.
 *
 * Las superficies semánticas (`bg-surface`, `text-foreground`, …) leen variables
 * CSS que inyectamos con `vars()` sobre un `View` raíz según `resolved`. `vars()`
 * re-renderiza al cambiar el modo, así que TODAS las pantallas conmutan a la vez:
 * imposible que una quede clara y otra oscura. Mismo set de tokens que la web →
 * identidad unificada. Además sincronizamos `setColorScheme(resolved)` para que el
 * mapa y cualquier variante `dark:` queden alineados.
 */
export type ThemePref = 'system' | 'light' | 'dark';

// Tokens de superficie por modo (mismos hex que `global.css` y que la web).
const THEME_VARS = {
  light: vars({
    '--color-background': '#f7f8f7',
    '--color-surface': '#ffffff',
    '--color-surface-muted': '#f1f5f3',
    '--color-foreground': '#0f1a16',
    '--color-foreground-muted': '#64726b',
    '--color-border': '#e3e8e5',
  }),
  dark: vars({
    '--color-background': '#0a0a0b',
    '--color-surface': '#141416',
    '--color-surface-muted': '#1c1c20',
    '--color-foreground': '#f4f4f5',
    '--color-foreground-muted': '#a1a1aa',
    '--color-border': '#2a2a2e',
  }),
} as const;

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
  const { setColorScheme } = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );

  // Restaura la preferencia guardada al arrancar (si no hay, sigue al sistema).
  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        const next: ThemePref =
          stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        setPrefState(next);
      })
      .catch(() => {
        /* sin almacenamiento: queda en `system` */
      });
    return () => {
      active = false;
    };
  }, []);

  // Escucha cambios del modo del sistema (sólo afecta cuando pref = 'system').
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const resolved: 'light' | 'dark' = pref === 'system' ? systemScheme : pref;

  // Mantiene NativeWind alineado (mapa día/noche + cualquier variante `dark:`).
  useEffect(() => {
    setColorScheme(resolved);
  }, [resolved, setColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      pref,
      resolved,
      setPref: (next) => {
        setPrefState(next);
        SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {
          /* almacenamiento no disponible: el tema vive sólo en memoria */
        });
      },
    }),
    [pref, resolved],
  );

  // El `View` con las variables del modo resuelto envuelve toda la app: cada
  // pantalla hereda los tokens y conmuta a la vez al cambiar de tema.
  return (
    <ThemeContext.Provider value={value}>
      <View style={THEME_VARS[resolved]} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useThemePref(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePref debe usarse dentro de <ThemeProvider>');
  return ctx;
}
