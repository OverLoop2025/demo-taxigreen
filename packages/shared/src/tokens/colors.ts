export const colors = {
  // Chrome del producto: VERDE ESMERALDA como sistema principal (renovación
  // 2026-06-06; reabre la decisión AZUL por pedido del usuario — más dopamina,
  // identidad coherente con la marca "Taxi Green"). DEFAULT legible con texto
  // blanco; `deep` = verde casi-negro para héroes y títulos; 400/500 = acentos
  // brillantes de alta dopamina para superficies oscuras.
  product: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#053226',
    DEFAULT: '#059669',
    deep: '#053226',
    fg: '#FFFFFF',
    muted: '#D1FAE5',
  },
  // Marca Taxi Green: chip de marca en esmeralda vivo (coherente con el chrome).
  brand: {
    tenant: '#10B981',
    tenantDeep: '#059669',
    tenantSoft: '#D1FAE5',
    tenantFg: '#053226',
  },
  care: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#6D28D9',
    600: '#5B21B6',
    700: '#4C1D95',
    DEFAULT: '#6D28D9',
    soft: '#EDE9FE',
    fg: '#FFFFFF',
  },
  semantic: {
    success: {
      DEFAULT: '#16A34A',
      soft: '#DCFCE7',
      fg: '#052E16',
    },
    warning: {
      DEFAULT: '#D97706',
      soft: '#FEF3C7',
      fg: '#451A03',
    },
    danger: {
      DEFAULT: '#DC2626',
      soft: '#FEE2E2',
      fg: '#450A0A',
    },
    info: {
      DEFAULT: '#059669',
      soft: '#D1FAE5',
      fg: '#053226',
    },
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1F2937',
  },
} as const;

export type ColorTokens = typeof colors;
