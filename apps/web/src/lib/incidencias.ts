import { Prisma } from '@taxigreen/database';

export const incidenciaSelect = {
  id: true,
  tenant_id: true,
  reserva_id: true,
  tipologia: true,
  severidad: true,
  estado: true,
  descripcion: true,
  timeline: true,
  tpr_seg: true,
  tr_seg: true,
  created_at: true,
  updated_at: true,
  closed_at: true,
  reserva: {
    select: {
      id: true,
      token_pasajero: true,
      voucher_codigo: true,
      pasajero_nombre: true,
      punto_encuentro: true,
      origen_texto: true,
      destino_texto: true,
      conductor_id: true,
      conductor: {
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true,
              telefono: true,
            },
          },
          vehiculo: {
            select: {
              placa: true,
              marca: true,
              modelo: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.incidenciasSelect;

export type IncidenciaRecord = Prisma.incidenciasGetPayload<{ select: typeof incidenciaSelect }>;

export type PublicIncidentData = {
  id: string;
  reservaId: string;
  voucherCodigo: string;
  tipologia: string;
  severidad: string;
  estado: string;
  descripcion: string;
  timeline: unknown[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  pasajeroNombre: string;
  ruta: {
    origen: string;
    puntoEncuentro: string | null;
    destino: string;
  };
  conductor: {
    id: string | null;
    nombre: string;
    telefono: string | null;
    unidad: string | null;
  };
};

export function timelineArray(value: Prisma.JsonValue): Prisma.InputJsonValue[] {
  return Array.isArray(value) ? (value as Prisma.InputJsonValue[]) : [];
}

function isoOrNull(date: Date | null) {
  return date ? date.toISOString() : null;
}

export function serializeIncident(incidencia: IncidenciaRecord): PublicIncidentData {
  const unidad = incidencia.reserva.conductor?.vehiculo;
  return {
    id: incidencia.id,
    reservaId: incidencia.reserva_id,
    voucherCodigo: incidencia.reserva.voucher_codigo,
    tipologia: incidencia.tipologia,
    severidad: incidencia.severidad,
    estado: incidencia.estado,
    descripcion: incidencia.descripcion,
    timeline: timelineArray(incidencia.timeline),
    createdAt: incidencia.created_at.toISOString(),
    updatedAt: incidencia.updated_at.toISOString(),
    closedAt: isoOrNull(incidencia.closed_at),
    pasajeroNombre: incidencia.reserva.pasajero_nombre,
    ruta: {
      origen: incidencia.reserva.origen_texto,
      puntoEncuentro: incidencia.reserva.punto_encuentro,
      destino: incidencia.reserva.destino_texto,
    },
    conductor: {
      id: incidencia.reserva.conductor?.id ?? null,
      nombre: incidencia.reserva.conductor?.usuario.nombre ?? 'Conductor asignado',
      telefono: incidencia.reserva.conductor?.usuario.telefono ?? null,
      unidad: unidad ? `${unidad.placa} · ${unidad.marca} ${unidad.modelo}` : null,
    },
  };
}
