import { describe, expect, it } from 'vitest';
import { generateMagicToken, validateMagicToken } from './magic-link';
import { hashPassword, verifyPassword } from './passwords';
import { hashPin, isValidPin, verifyPin } from './pin';

describe('auth helpers', () => {
  it('hashea y valida passwords con bcrypt', async () => {
    const passwordHash = await hashPassword('demo1234');

    expect(passwordHash).not.toBe('demo1234');
    await expect(verifyPassword('demo1234', passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('incorrecto', passwordHash)).resolves.toBe(false);
  });

  it('hashea y valida PINs de conductor', async () => {
    const pinHash = await hashPin('1234');

    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12ab')).toBe(false);
    await expect(verifyPin('1234', pinHash)).resolves.toBe(true);
    await expect(verifyPin('4321', pinHash)).resolves.toBe(false);
  });

  it('firma tokens publicos temporales', () => {
    const token = generateMagicToken('reserva-demo');
    const payload = validateMagicToken(token);

    expect(payload?.sub).toBe('reserva-demo');
    expect(validateMagicToken(`${token}x`)).toBeNull();
  });
});
