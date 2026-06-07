import { describe, it, expect } from 'vitest';
import { colors, FLUJO_PROTAGONISTA } from '@taxigreen/shared';

describe('apps/web smoke (Sprint 1)', () => {
  it('puede importar tokens compartidos (paleta verde esmeralda)', () => {
    expect(colors.product.DEFAULT).toBe('#059669');
  });

  it('respeta el contrato de flujo protagonista', () => {
    expect(FLUJO_PROTAGONISTA.tipoViaje).toBe('recojo_aeropuerto');
  });
});
