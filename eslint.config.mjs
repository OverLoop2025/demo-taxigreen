// @ts-check
// ESLint flat config (raíz). Una sola config gobierna el monorepo; cada paquete
// la referencia con `eslint . --config <ruta>/eslint.config.mjs` (Sprint 0).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  // Objeto SOLO-ignores (debe ir aislado en flat config).
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
      '**/babel.config.js',
      '**/metro.config.js',
      '**/next-env.d.ts',
      '**/expo-env.d.ts',
      '**/nativewind-env.d.ts',
      'packages/database/src/generated/**',
      // Documentación del repo (no es código del monorepo).
      '00_EVIDENCIA_REAL/**',
      '01_INVESTIGACIONES_IA/**',
      '02_PROPUESTAS_PREVIAS/**',
      '03_REFERENCIAS_EXTERNAS/**',
      '04_SINTESIS_TRABAJO/**',
      '05_FINAL/**',
      '06_DEMO_TECNICA/**',
      '07_PLAN_EJECUCION/**',
      '_FUENTE_DESARROLLO/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
