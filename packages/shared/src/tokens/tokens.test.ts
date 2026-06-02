import { describe, it, expect } from 'vitest';
import { colors, spacing, typography } from './index';
import { FLUJO_PROTAGONISTA } from '../index';

describe('design tokens (paleta AZUL dual)', () => {
  it('el chrome del producto es azul', () => {
    expect(colors.product.DEFAULT).toBe('#227FDE');
    expect(colors.product.deep).toBe('#0B0952');
  });

  it('el verde queda reservado a la marca/tenant', () => {
    expect(colors.brand.tenant).toBe('#0B7A3B');
  });

  it('expone semanticos, tipografia y spacing para Tailwind', () => {
    expect(colors.semantic.danger.DEFAULT).toBe('#DC2626');
    expect(typography.fontFamily.sans[0]).toBe('Inter');
    expect(spacing[4]).toBe('1rem');
  });
});

describe('flujo protagonista (contrato)', () => {
  it('es recojo en aeropuerto, no traslado hacia aeropuerto', () => {
    expect(FLUJO_PROTAGONISTA.tipoViaje).toBe('recojo_aeropuerto');
    expect(FLUJO_PROTAGONISTA.origenTexto).toContain('Jorge Chávez');
    expect(FLUJO_PROTAGONISTA.destinoTexto).toContain('Miraflores');
  });
});
