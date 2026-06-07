import { describe, it, expect } from 'vitest';
import { colors, spacing, typography } from './index';
import { FLUJO_PROTAGONISTA } from '../index';

describe('design tokens (paleta VERDE esmeralda)', () => {
  it('el chrome del producto es verde esmeralda', () => {
    expect(colors.product.DEFAULT).toBe('#059669');
    expect(colors.product.deep).toBe('#053226');
  });

  it('la marca/tenant usa el verde esmeralda vivo', () => {
    expect(colors.brand.tenant).toBe('#10B981');
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
