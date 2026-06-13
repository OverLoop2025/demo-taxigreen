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

    // Con el set de campos vitales más liviano (sin exigir nombre/teléfono), un
    // mensaje sin origen ni destino aún cae en confianza moderada-baja y pide datos.
    expect(result.confianza).toBeLessThanOrEqual(0.6);
    expect(result.reserva.destino_texto).toBeNull();
    expect(result.reserva.tipo_pago).toBeNull();
    expect(result.preguntas_aclaracion.length).toBeGreaterThan(0);
  });

  it('clasifica A: recoger en el Jorge Chávez como recojo de aeropuerto', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hotel solicita recoger en el Jorge Chávez a pasajera Elena Rivas mañana 03:40, vuelo LA2456, destino Av. Pardo 123 Miraflores, voucher hotel, tel pasajera 955111222.',
    });

    expect(result.reserva.tipo_viaje).toBe('recojo_aeropuerto');
    expect(result.reserva.origen_texto).toBe('Aeropuerto Jorge Chávez - Llegadas');
    expect(result.reserva.destino_texto).toBe('Av. Pardo 123, Miraflores');
  });

  it('clasifica B: llevar al aeropuerto desde hotel como traslado sin pedir mostrador', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Hotel Costa Verde: llevar al aeropuerto al huésped Camila Rojas mañana 18:30, vuelo LA640, recojo en el lobby (Av. Malecón 200, Miraflores), pago con voucher del hotel, tel +51 911 555 333.',
    });

    expect(result.reserva.tipo_viaje).toBe('traslado_aeropuerto');
    expect(result.reserva.origen_texto).toBe('Hotel Costa Verde, Av. Malecón 200, Miraflores');
    expect(result.reserva.destino_texto).toBe('Aeropuerto Jorge Chávez - Salidas');
    expect(result.reserva.punto_encuentro).toBeNull();
    expect(result.campos_esperados).toContain('vuelo_codigo');
    expect(result.campos_esperados).not.toContain('punto_encuentro');
  });

  it('clasifica B: traslado al aeropuerto desde San Isidro', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Traslado al aeropuerto desde San Isidro para pasajero Diego Lama mañana 21:10, vuelo CM132, factura empresa, tel pasajero 987654321.',
    });

    expect(result.reserva.tipo_viaje).toBe('traslado_aeropuerto');
    expect(result.reserva.origen_texto).toBe('San Isidro, Lima');
    expect(result.reserva.destino_texto).toBe('Aeropuerto Jorge Chávez - Salidas');
  });

  it('expresa los 6 casos de identidad comercial del master F5', () => {
    const casos = [
      {
        nombre: 'particular comun',
        mensaje:
          'Soy Lucía Torres, necesito taxi city a Miraflores hoy 18:30, pago efectivo, mi celular 955111222.',
        esperado: {
          perfil_pasajero: 'particular',
          responsable_pago: 'pasajero',
          tipo_pago: 'efectivo',
          convenio_validado_demo: false,
          requiere_factura: false,
        },
      },
      {
        nombre: 'trabajador convenio viaje trabajo',
        mensaje:
          'Trabajo en ACME Perú. Traslado al aeropuerto desde San Isidro para pasajero Diego Lama mañana 21:10, vuelo CM132, tel pasajero 987654321, lo cubre la empresa con factura empresa RUC 20100070970.',
        esperado: {
          perfil_pasajero: 'corporativo',
          responsable_pago: 'empresa',
          tipo_pago: 'factura_empresa',
          convenio_validado_demo: true,
          requiere_factura: true,
        },
      },
      {
        nombre: 'corporativo viaje personal',
        mensaje:
          'Soy analista de ACME Perú, pero es viaje personal: recojo aeropuerto para Carlos Ruiz mañana 08:10 vuelo LA2456, destino Miraflores, esta vez lo pago yo con tarjeta, tel 955111222.',
        esperado: {
          perfil_pasajero: 'corporativo',
          responsable_pago: 'pasajero',
          tipo_pago: 'app_pago',
          convenio_validado_demo: true,
          requiere_factura: false,
        },
      },
      {
        nombre: 'empresa sin convenio',
        mensaje:
          'Trabajo en Empresa Fantasma. Traslado al aeropuerto desde San Isidro para pasajero Luis Nuñez mañana 19:20, vuelo H2552, lo cubre la empresa con factura, tel pasajero 977111222.',
        esperado: {
          perfil_pasajero: 'corporativo',
          responsable_pago: 'pasajero',
          tipo_pago: null,
          convenio_validado_demo: false,
          requiere_factura: true,
        },
      },
      {
        nombre: 'hotel paga hotel',
        mensaje:
          'Hotel Costa Verde: llevar al aeropuerto al huésped Camila Rojas mañana 18:30, vuelo LA640, recojo en el lobby Av. Malecón 200 Miraflores, pago con voucher del hotel, tel +51 911 555 333.',
        esperado: {
          perfil_pasajero: 'hotel',
          responsable_pago: 'hotel',
          tipo_pago: 'voucher_hotel',
          convenio_validado_demo: true,
          requiere_factura: false,
        },
      },
      {
        nombre: 'particular pide factura',
        mensaje:
          'Soy Ana Pérez, necesito recojo aeropuerto mañana 11:15 vuelo JA700, destino San Isidro, pago con tarjeta y necesito factura con RUC 20100070970, tel 944111222.',
        esperado: {
          perfil_pasajero: 'particular',
          responsable_pago: 'pasajero',
          tipo_pago: 'app_pago',
          convenio_validado_demo: false,
          requiere_factura: true,
        },
      },
    ] as const;

    for (const caso of casos) {
      const result = extraerReservaDeterminista({
        fechaActualIso: FECHA_REFERENCIA_S4,
        mensaje: caso.mensaje,
      });
      expect(
        {
          perfil_pasajero: result.reserva.perfil_pasajero,
          responsable_pago: result.reserva.responsable_pago,
          tipo_pago: result.reserva.tipo_pago,
          convenio_validado_demo: result.reserva.convenio_validado_demo,
          requiere_factura: result.reserva.requiere_factura,
        },
        caso.nombre,
      ).toEqual(caso.esperado);
      if (caso.nombre === 'empresa sin convenio') {
        expect(result.reserva.empresa_nombre).toBe('Empresa Fantasma');
      }
    }
  });

  it('prioriza la intención reciente sobre el contexto acumulado', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      contextoConversacion:
        'Reserva previa: recojo aeropuerto para pasajero Marco Ruiz mañana 10:00 vuelo LA2456, destino Av. Pardo 123 Miraflores, 3 personas, punto de encuentro Salida 3 columna F2, pago app, tel 944111222.',
      mensaje: 'Me equivoqué, solo voy yo y salgo por la puerta 4.',
    });

    expect(result.reserva.pasajeros).toBe(1);
    expect(result.reserva.pasajeros_cantidad).toBe(1);
    expect(result.reserva.punto_encuentro).toBe('Puerta 4');
    expect(result.reserva.destino_texto).toBe('Av. Pardo 123, Miraflores');
    expect(result.reserva.tipo_viaje).toBe('recojo_aeropuerto');
  });

  it('clasifica vuelo con origen residencial explícito como traslado al aeropuerto', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Tengo vuelo LA640 mañana 18:30, recógeme en mi casa de San Isidro para ir al aeropuerto, pago con tarjeta, tel 944111222.',
    });

    expect(result.reserva.tipo_viaje).toBe('traslado_aeropuerto');
    expect(result.reserva.origen_texto).toContain('San Isidro');
    expect(result.reserva.destino_texto).toBe('Aeropuerto Jorge Chávez - Salidas');
  });

  it('no convierte a corporativo a un particular que pide factura', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Soy particular, necesito recojo aeropuerto mañana 12:10 vuelo JA701, destino Miraflores, pago app y quiero factura con RUC 20100070970, tel 933111222.',
    });

    expect(result.reserva.perfil_pasajero).toBe('particular');
    expect(result.reserva.responsable_pago).toBe('pasajero');
    expect(result.reserva.tipo_pago).toBe('app_pago');
    expect(result.reserva.requiere_factura).toBe(true);
  });

  it('entiende léxico real del Jorge Chávez: puerta, aerolínea y retraso', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Mi vuelo H2552 se retrasó, aterrizo mañana 17:40 y salgo por la puerta 4, columna F2. Recojo aeropuerto para pasajero Álvaro Casas, destino San Borja, pago efectivo, tel 988000111.',
    });

    expect(result.reserva.tipo_viaje).toBe('recojo_aeropuerto');
    expect(result.reserva.vuelo_codigo).toBe('H2552');
    expect(result.reserva.punto_encuentro).toBe('Puerta 4, columna F2');
    expect(result.reserva.fecha_hora_servicio).toContain('2026-06-01');
  });

  it('documenta el sesgo: texto aeroportuario ambiguo cae a recojo de aeropuerto', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Servicio aeropuerto para pasajera Laura Núñez mañana 09:20, vuelo LA2100, destino Miraflores, pago app, tel 922333444.',
    });

    // DECISIÓN: si el mensaje menciona aeropuerto/vuelo pero no dirección clara del tramo,
    // la demo privilegia recojo_aeropuerto porque es el flujo dominante de Taxi Green.
    expect(result.reserva.tipo_viaje).toBe('recojo_aeropuerto');
  });

  it('valida RUC peruano antes de aceptarlo', () => {
    expect(validarRuc('20100070970')).toBe(true);
    expect(validarRuc('20123456789')).toBe(false);
  });

  it('extrae el nombre del pasajero desde "para X"', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Necesito recojo aeropuerto para Carlos Ruiz mañana 08:10 vuelo LA2456, destino Miraflores, pago app, tel 955111222.',
    });
    expect(result.reserva.pasajero_nombre).toBe('Carlos Ruiz');
  });

  it('acepta un nombre suelto como respuesta a la pregunta del copiloto', () => {
    const result = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      contextoConversacion: 'recojo aeropuerto mañana 09:00 vuelo LA2456 destino Miraflores, pago app',
      mensaje: 'Carlos Ruiz',
    });
    expect(result.reserva.pasajero_nombre).toBe('Carlos Ruiz');
  });

  it('toma el nombre del particular desde "soy X", sin confundir al solicitante del hotel', () => {
    const particular = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje: 'Soy Lucía Torres, necesito taxi city a Miraflores hoy 18:30, pago efectivo, mi celular 955111222.',
    });
    expect(particular.reserva.pasajero_nombre).toBe('Lucía Torres');

    const protagonista = WHATSAPP_CASOS_S4[0]!;
    const hotel = extraerReservaDeterminista(protagonista.input);
    // "Soy Mariana del Hilton" es el SOLICITANTE; el pasajero es la huésped.
    expect(hotel.reserva.pasajero_nombre).toBe('Valeria Mendoza');
  });

  it('resuelve la zona del aeropuerto por flujo y ámbito (A internacional, B nacional)', () => {
    const llegadaInternacional = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Recojo aeropuerto para pasajero Juan Pérez, vuelo internacional LA8000 desde Madrid, mañana 14:00, destino San Isidro, pago app, tel 955111222.',
    });
    expect(llegadaInternacional.reserva.tipo_viaje).toBe('recojo_aeropuerto');
    expect(llegadaInternacional.reserva.origen_texto).toContain('Llegadas Internacionales');

    const salidaNacional = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Traslado al aeropuerto desde San Isidro, vuelo nacional a Cusco LP500 mañana 06:00, pago efectivo, tel 955111222.',
    });
    expect(salidaNacional.reserva.tipo_viaje).toBe('traslado_aeropuerto');
    expect(salidaNacional.reserva.destino_texto).toContain('Salidas Nacionales');
  });

  it('ajusta los campos vitales según el perfil (particular sin nombre; corporativo con empresa+RUC)', () => {
    const particular = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje: 'Soy particular, recojo aeropuerto mañana 10:00 vuelo LA2456 destino Miraflores, pago efectivo.',
    });
    expect(particular.campos_esperados).not.toContain('pasajero_nombre');

    const corporativo = extraerReservaDeterminista({
      fechaActualIso: FECHA_REFERENCIA_S4,
      mensaje:
        'Trabajo en ACME Perú, traslado al aeropuerto desde San Isidro mañana 21:00 vuelo CM132, lo cubre la empresa, tel pasajero 987654321.',
    });
    expect(corporativo.campos_esperados).toContain('empresa_nombre');
    expect(corporativo.campos_esperados).toContain('pasajero_ruc');
  });
});
