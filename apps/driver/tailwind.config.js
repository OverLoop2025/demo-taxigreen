/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Modo claro/oscuro por clase (.dark). El sistema decide por defecto; el conductor
  // puede forzarlo desde Perfil → Apariencia (ThemeProvider + setColorScheme).
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Superficies semánticas = variables CSS (global.css) que flotan entre
        // claro/oscuro. Idénticas a la web → identidad unificada y coherencia total.
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        foreground: 'var(--color-foreground)',
        'foreground-muted': 'var(--color-foreground-muted)',
        border: 'var(--color-border)',
        // Verde esmeralda de alta dopamina (acción/energía). Constante en ambos modos.
        brand: {
          DEFAULT: '#10B981', // acción principal / acentos
          deep: '#059669', // presionado / variante profunda
          glow: '#34D399', // realces, estados activos
          soft: '#064E3B', // verde muy oscuro para fondos sutiles
          tenant: '#10B981', // chip de marca
        },
        // `ink` = escala fija (no temática). Sólo para texto sobre el verde de marca
        // (`text-ink-900`) y acentos que deben ser constantes en cualquier modo.
        ink: {
          DEFAULT: '#0A0A0B',
          900: '#0A0A0B',
          800: '#141416',
          700: '#1C1C20',
          600: '#26262B',
          line: '#2E2E34',
        },
        // Compat de clases `product*` heredadas.
        product: {
          DEFAULT: '#10B981',
          deep: '#0A0A0B',
        },
      },
    },
  },
  plugins: [],
};
