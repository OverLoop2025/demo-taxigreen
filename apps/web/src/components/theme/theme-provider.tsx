'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Tema claro/oscuro (Renovación F1) sin dependencias externas.
 * El script anti-parpadeo en `layout.tsx` ya fija la clase `.dark` antes del paint;
 * este provider sincroniza el estado de React y persiste la preferencia.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tg-theme';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  // Lee el tema real ya aplicado por el script anti-parpadeo al montar.
  useEffect(() => {
    const initial: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* almacenamiento no disponible: el tema vive solo en memoria */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

/** Script inline (string) que aplica el tema antes del primer paint para evitar parpadeo. */
export const themeNoFlashScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;
