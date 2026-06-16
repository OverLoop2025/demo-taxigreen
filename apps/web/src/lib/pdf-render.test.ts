import { renderComprobantePdf, type ComprobanteTemplateInput } from '@taxigreen/comprobantes';
import { describe, expect, it } from 'vitest';

const base: ComprobanteTemplateInput = {
  id: 'r1',
  tipo: 'factura',
  serie: 'F001',
  correlativo: 12,
  monto: '78.50',
  estado: 'emitido',
  pasajeroNombre: 'María José Gutiérrez Ñañez',
  pasajeroDocumento: '20512345678',
  empresaNombre: 'Corporación Andina del Perú S.A.C.',
  origenTexto: 'Aeropuerto Jorge Chávez - Llegadas Nacionales (Piso 1)',
  destinoTexto: 'Av. Pardo 123, Miraflores, Lima',
  puntoEncuentro: 'Salida 3, columna F2',
  vueloCodigo: 'LA2456',
  voucherCodigo: 'TG-2026-0042',
};

describe('renderComprobantePdf (pdf-lib)', () => {
  it('genera un PDF válido para factura sin lanzar por glifos especiales', async () => {
    const pdf = await renderComprobantePdf(base);
    expect(pdf.length).toBeGreaterThan(1200);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('genera boleta con caracteres acentuados y flechas saneadas', async () => {
    const pdf = await renderComprobantePdf({
      ...base,
      tipo: 'boleta',
      serie: 'B001',
      empresaNombre: null,
      destinoTexto: 'Destino con flecha → y símbolo ✦ y emoji 🚕',
    });
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1200);
  });
});
