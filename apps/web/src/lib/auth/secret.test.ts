import { afterEach, describe, expect, it, vi } from 'vitest';

// El fail-fast de AUTH_SECRET es una red de seguridad: evita que el secreto de
// desarrollo llegue a producción en silencio (firmaría sesiones JWT con una clave
// pública conocida). Si un refactor borra el guard, este test se vuelve rojo.
describe('AUTH_SECRET — fail-fast de producción', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('no lanza fuera de producción y expone un secreto utilizable', async () => {
    vi.resetModules();
    const mod = await import('./secret');
    expect(mod.AUTH_SECRET).toBeTruthy();
  });

  it('lanza si falta AUTH_SECRET en runtime de producción (no CI, no build)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CI', '');
    vi.stubEnv('NEXT_PHASE', '');
    vi.stubEnv('AUTH_SECRET', '');
    vi.resetModules();

    await expect(import('./secret')).rejects.toThrow(/AUTH_SECRET/);
  });

  it('NO lanza durante el build de producción (phase-production-build sin secretos)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CI', '');
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.stubEnv('AUTH_SECRET', '');
    vi.resetModules();

    await expect(import('./secret')).resolves.toBeTruthy();
  });

  it('NO lanza en CI aunque NODE_ENV sea production (pipeline sin secretos)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CI', 'true');
    vi.stubEnv('NEXT_PHASE', '');
    vi.stubEnv('AUTH_SECRET', '');
    vi.resetModules();

    await expect(import('./secret')).resolves.toBeTruthy();
  });
});
