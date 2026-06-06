import type { Config } from 'tailwindcss';
import { colors, spacing, typography } from '@taxigreen/shared/tokens';

type ThemeExtend = NonNullable<NonNullable<Config['theme']>['extend']>;

const fontSize = Object.fromEntries(
  Object.entries(typography.fontSize).map(([key, [size, options]]) => [key, [size, { ...options }]]),
) as ThemeExtend['fontSize'];

/**
 * Tailwind — Taxi Green.
 * Paleta AZUL (decisión cerrada): chrome del producto en azul; verde reservado
 * a marca/tenant; púrpura para bienestar (care).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  // Modo claro/oscuro por clase `.dark` en <html> (ThemeProvider). Renovación F1.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        product: colors.product,
        brand: colors.brand,
        care: colors.care,
        neutral: colors.neutral,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        danger: colors.semantic.danger,
        info: colors.semantic.info,
        // Superficies semánticas = variables CSS para que floten entre claro/oscuro.
        // Light mode conserva los valores actuales (cero regresión visual).
        background: 'var(--color-background)',
        border: 'var(--color-border)',
        foreground: 'var(--color-foreground)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        'foreground-muted': 'var(--color-foreground-muted)',
      },
      fontFamily: {
        sans: [...typography.fontFamily.sans],
        mono: [...typography.fontFamily.mono],
      },
      fontSize,
      fontWeight: typography.fontWeight,
      spacing,
    },
  },
  plugins: [],
};

export default config;
