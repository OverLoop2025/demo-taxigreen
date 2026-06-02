import { describe, it, expect } from 'vitest';
import { colors, FLUJO_PROTAGONISTA } from '@taxigreen/shared';

describe('apps/web smoke (Sprint 1)', () => {
  it('puede importar tokens compartidos (paleta azul)', () => {
    expect(colors.product.DEFAULT).toBe('#227FDE');
  });

  it('respeta el contrato de flujo protagonista', () => {
    expect(FLUJO_PROTAGONISTA.tipoViaje).toBe('recojo_aeropuerto');
  });
});
