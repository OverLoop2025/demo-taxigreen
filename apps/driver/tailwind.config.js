/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Renovación móvil (2026-06-06): app conductor DARK-first + verde esmeralda
        // de alta dopamina. Se abandona el azul. Verde = acción/energía; negro/gris
        // neutro = superficies premium (estilo Uber Driver / Waze de noche).
        brand: {
          DEFAULT: '#10B981', // esmeralda — acción principal / acentos
          deep: '#059669', // presionado / variante profunda
          glow: '#34D399', // realces, estados activos
          soft: '#064E3B', // verde muy oscuro para fondos sutiles
          tenant: '#10B981', // chip de marca
        },
        ink: {
          DEFAULT: '#0A0A0B', // fondo base (negro)
          900: '#0A0A0B',
          800: '#141416', // tarjetas
          700: '#1C1C20', // tarjetas elevadas / inputs
          600: '#26262B',
          line: '#2E2E34', // bordes
        },
        // Compat: clases `product*` existentes (perfil/incidencia aún por migrar)
        // ahora apuntan al verde y al negro para mantener cohesión sin reescribir todo.
        product: {
          DEFAULT: '#10B981',
          deep: '#0A0A0B',
        },
      },
    },
  },
  plugins: [],
};
