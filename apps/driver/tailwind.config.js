/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta AZUL (decisión cerrada): chrome del producto en azul.
        product: {
          DEFAULT: '#227FDE',
          deep: '#0B0952',
        },
        // Verde reservado a marca/tenant.
        brand: {
          tenant: '#0B7A3B',
        },
      },
    },
  },
  plugins: [],
};
