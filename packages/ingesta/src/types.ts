import { z } from 'zod';

export const canalOrigenSchema = z.enum([
  'whatsapp_oficial',
  'whatsapp_manual',
  'web_landing',
  'counter',
  'llamada',
  'hotel',
]);

export const tipoViajeSchema = z.enum(['recojo_aeropuerto', 'traslado_aeropuerto', 'city']);

export const tipoPagoSchema = z.enum([
  'efectivo',
  'voucher_hotel',
  'factura_empresa',
  'app_pago',
]);

export const perfilPasajeroSchema = z.enum(['particular', 'corporativo', 'hotel']);

export const responsablePagoSchema = z.enum(['pasajero', 'empresa', 'hotel']);

export const tipoVehiculoSchema = z.enum(['sedan', 'camioneta', 'van', 'minivan']);

export const equipajeNivelSchema = z.enum(['poco', 'normal', 'grande']);

export const solicitanteTipoSchema = z.enum(['hotel', 'empresa', 'pasajero', 'operador']).nullable();

export const fuenteDecisionSchema = z.enum(['algoritmo', 'llm']);

export const reservaExtraidaSchema = z.object({
  canal_origen: canalOrigenSchema,
  tipo_viaje: tipoViajeSchema.nullable(),
  solicitante_tipo: solicitanteTipoSchema,
  solicitante_nombre: z.string().nullable(),
  solicitante_contacto: z.string().nullable(),
  pasajero_nombre: z.string().nullable(),
  pasajero_telefono: z.string().nullable(),
  pasajero_email: z.string().nullable(),
  pasajero_dni: z.string().nullable(),
  pasajero_ruc: z.string().nullable(),
  origen_texto: z.string().nullable(),
  origen_lat: z.number().nullable(),
  origen_lng: z.number().nullable(),
  destino_texto: z.string().nullable(),
  destino_lat: z.number().nullable(),
  destino_lng: z.number().nullable(),
  punto_encuentro: z.string().nullable(),
  fecha_hora_servicio: z.string().nullable(),
  vuelo_codigo: z.string().nullable(),
  tipo_pago: tipoPagoSchema.nullable(),
  perfil_pasajero: perfilPasajeroSchema.nullable(),
  responsable_pago: responsablePagoSchema.nullable(),
  convenio_validado_demo: z.boolean(),
  requiere_factura: z.boolean(),
  vehiculo_preferencia: tipoVehiculoSchema.nullable(),
  pasajeros_cantidad: z.number().int().positive().nullable(),
  equipaje_nivel: equipajeNivelSchema.nullable(),
  pasajeros: z.number().int().positive().nullable(),
  maletas: z.number().int().min(0).nullable(),
  hotel_nombre: z.string().nullable(),
  empresa_nombre: z.string().nullable(),
  raw_texto: z.string(),
});

export const extraccionReservaResultadoSchema = z.object({
  reserva: reservaExtraidaSchema,
  confianza: z.number().min(0).max(1),
  fuente: fuenteDecisionSchema,
  motivo: z.string(),
  modelo: z.string().nullable().optional(),
  preguntas_aclaracion: z.array(z.string()),
  campos_extraidos: z.array(z.string()),
  campos_esperados: z.array(z.string()),
});

export const extractorInputSchema = z.object({
  mensaje: z.string().min(1),
  contextoConversacion: z.string().optional(),
  fechaActualIso: z.string().optional(),
});

export type CanalOrigen = z.infer<typeof canalOrigenSchema>;
export type TipoViaje = z.infer<typeof tipoViajeSchema>;
export type TipoPago = z.infer<typeof tipoPagoSchema>;
export type PerfilPasajero = z.infer<typeof perfilPasajeroSchema>;
export type ResponsablePago = z.infer<typeof responsablePagoSchema>;
export type TipoVehiculo = z.infer<typeof tipoVehiculoSchema>;
export type EquipajeNivel = z.infer<typeof equipajeNivelSchema>;
export type SolicitanteTipo = z.infer<typeof solicitanteTipoSchema>;
export type FuenteDecision = z.infer<typeof fuenteDecisionSchema>;
export type ReservaExtraida = z.infer<typeof reservaExtraidaSchema>;
export type ExtraccionReservaResultado = z.infer<typeof extraccionReservaResultadoSchema>;
export type ExtractorInput = z.infer<typeof extractorInputSchema>;

export type DireccionNormalizada = {
  texto: string;
  lat: number | null;
  lng: number | null;
};
