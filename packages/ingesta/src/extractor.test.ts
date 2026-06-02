import { describe, expect, it } from 'vitest';
import { extraerReservaDeterminista } from './extractor';
import { FECHA_REFERENCIA_S4, WHATSAPP_CASOS_S4 } from './test-suite/whatsapps';
import { validarRuc } from './post-procesamiento';

describe('ExtractorDeterminista', () => {
  it('extrae el flujo protagonista sin convertir al hotel en origen físico', () => {
    const protagonista = WHATSAPP_CASOS_S4[0]!;
    expect(protagonista).toBeDefined();

    const result = extraerReservaDeterminista(protagonista.input);

    expect(result.fuente).toBe('algoritmo');
    expect(result.confianza).toBeGreaterThanOrEqual(0.9);
    expect(result.reserva.tipo_viaje).toBe('recojo_aeropuerto');
    expect(result.reserva.solicitante_tipo).toBe('hotel');
    expect(result.reserva.origen_texto).toBe('Aeropuerto Jorge Chávez - Llegadas');
    expect(result.reserva.destino_texto).toBe('Av. Pardo 123, Miraflores');
    expect(result.reserva.pasajero_nombre).toBe('Valeria Mendoza');
    expect(result.reserva.punto_encuentro).toBe('Salida 3, columna F2');
    expect(result.reserva.vuelo_codigo).toBe('LA2456');
    expect(result.reserva.tipo_pago).toBe('voucher_hotel');
    expect(result.reserva.fecha_hora_servicio).toContain('2026-06-01');
  });

  it('cubre 15 variantes de WhatsApp con mínimos esperados', () => {
    for (const caso of WHATSAPP_CASOS_S4) {
      const result = extraerReservaDeterminista(caso.input);
      for (const [campo, valor] of Object.entries(caso.esperadoMinimo)) {
        expect(result.reserva[campo as keyof typeof result.reserva], caso.nombre).toBe(valor);
      }
    }
  });

  it('no inventa datos faltantes y propone preguntas de aclaración', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje: 'Necesito un taxi bonito mañana.',
    });

    expect(result.confianza).toBeLessThan(0.6);
    expect(result.reserva.destino_texto).toBeNull();
    expect(result.reserva.tipo_pago).toBeNull();
    expect(result.preguntas_aclaracion.length).toBeGreaterThan(0);
  });

  it('valida RUC peruano antes de aceptarlo', () => {
    expect(validarRuc('20100070970')).toBe(true);
    expect(validarRuc('20123456789')).toBe(false);
  });
});
