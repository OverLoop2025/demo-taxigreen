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
        background: colors.neutral.background,
        border: colors.neutral.border,
        foreground: colors.neutral.text,
        surface: colors.neutral.surface,
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
