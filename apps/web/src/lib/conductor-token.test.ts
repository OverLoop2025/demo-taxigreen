import { describe, expect, it } from 'vitest';
import { createConductorToken, verifyConductorToken } from './conductor-token';

const payload = {
  userId: 'usuario-demo',
  tenantId: 'tenant-demo',
  conductorId: 'conductor-demo',
  email: 'conductor1@taxigreen.demo',
  nombre: 'Raul Quispe',
  role: 'conductor' as const,
};

describe('conductor mobile token', () => {
  it('firma y verifica un token Bearer para la app conductor', async () => {
    const token = await createConductorToken(payload);
    const verified = await verifyConductorToken(token);

    expect(verified).toEqual(payload);
  });

  it('rechaza tokens alterados', async () => {
    const token = await createConductorToken(payload);

    await expect(verifyConductorToken(`${token}x`)).resolves.toBeNull();
  });
});
