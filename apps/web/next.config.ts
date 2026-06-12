import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Los packages del monorepo se consumen como TypeScript fuente.
  transpilePackages: [
    '@taxigreen/shared',
    '@taxigreen/voucher',
    '@taxigreen/comprobantes',
    '@taxigreen/integraciones-reniec',
    '@taxigreen/ingesta',
    '@taxigreen/asignacion',
    '@taxigreen/bienestar',
    '@taxigreen/rutas',
    '@taxigreen/pagos',
    '@taxigreen/ia',
  ],
  // Puppeteer y su Chromium NO deben empaquetarse: el bundling de Next rompe
  // la dependencia `ws` (TypeError: b.mask is not a function) y forzaría el
  // fallback incluso con Chromium disponible (también en Railway). Se resuelven
  // en runtime desde node_modules.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  // `serverExternalPackages` no atraviesa los `transpilePackages`, así que
  // @taxigreen/comprobantes (transpilado) seguía arrastrando puppeteer-core/ws
  // al bundle. Forzamos los externals del build de servidor a bajo nivel para
  // que `require` los resuelva en runtime venga de donde venga la importación.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        'puppeteer-core',
        '@sparticuz/chromium-min',
        'ws',
        'bufferutil',
        'utf-8-validate',
      ];
    }
    return config;
  },
};

export default nextConfig;
