import { describe, expect, it, beforeEach, vi } from 'vitest';

// Mockeamos sólo el cliente prisma del paquete database, conservando enums y el
// helper `Prisma.validator` (que el repositorio usa en tiempo de import). El valor
// de este test no es el resultado de la query (mockeado), sino BLINDAR el `where`:
// el aislamiento conductor↔conductor y tenant↔tenant es una garantía de seguridad
// que vive en esas cláusulas. Si un refactor borra `tenant_id` o el scope de
// usuario activo/rol conductor, este test se vuelve rojo antes de filtrar datos.
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock('@taxigreen/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@taxigreen/database')>();
  return { ...actual, prisma: { reservas: { findFirst } } };
});

import { EstadoReserva, Rol } from '@taxigreen/database';
import type { ConductorTokenPayload } from './conductor-token';
import {
  findActiveAsignacionForConductor,
  findAsignacionForConductor,
} from './conductor-asignacion-repository';

const session: ConductorTokenPayload = {
  userId: 'user-cond-1',
  tenantId: 'tenant-1',
  conductorId: 'cond-1',
  email: 'conductor1@taxigreen.demo',
  nombre: 'Raúl Quispe',
  role: 'conductor',
};

const scopeUsuarioConductor = {
  conductor: {
    usuario: {
      id: 'user-cond-1',
      rol: Rol.conductor,
      activo: true,
      deleted_at: null,
    },
  },
};

beforeEach(() => {
  findFirst.mockReset();
  findFirst.mockResolvedValue(null);
});

describe('findActiveAsignacionForConductor — contrato de aislamiento', () => {
  it('filtra por tenant, conductor, no-cancelada y usuario conductor activo', async () => {
    await findActiveAsignacionForConductor(session);

    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.where).toMatchObject({
      tenant_id: 'tenant-1',
      conductor_id: 'cond-1',
      deleted_at: null,
      estado: {
        notIn: [EstadoReserva.finalizada, EstadoReserva.por_liquidar, EstadoReserva.cancelada],
      },
      ...scopeUsuarioConductor,
    });
  });

  it('exige usuario activo (un conductor desactivado nunca recupera asignación)', async () => {
    await findActiveAsignacionForConductor(session);
    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.where.conductor.usuario.activo).toBe(true);
    expect(arg.where.conductor.usuario.rol).toBe(Rol.conductor);
    expect(arg.where.conductor.usuario.deleted_at).toBeNull();
  });

  it('excluye reservas CERRADAS (canceladas/finalizadas/por liquidar viven en el historial, no en "tienes un viaje")', async () => {
    await findActiveAsignacionForConductor(session);
    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.where.estado).toEqual({
      notIn: [EstadoReserva.finalizada, EstadoReserva.por_liquidar, EstadoReserva.cancelada],
    });
  });

  it('ordena por servicio más reciente para elegir la vigente, no una antigua', async () => {
    await findActiveAsignacionForConductor(session);
    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.orderBy).toEqual({ fecha_hora_servicio: 'desc' });
  });

  it('proyecta un select acotado (no expone hashes ni campos crudos sin control)', async () => {
    await findActiveAsignacionForConductor(session);
    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.select).toBeTruthy();
    expect(arg.select.password_hash).toBeUndefined();
    expect(arg.select.voucher_qr_payload).toBeUndefined();
  });
});

describe('findAsignacionForConductor — contrato de aislamiento por id', () => {
  it('exige id + tenant + conductor + usuario conductor activo (A no ve la reserva de B)', async () => {
    await findAsignacionForConductor(session, 'reserva-9');

    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.where).toMatchObject({
      id: 'reserva-9',
      tenant_id: 'tenant-1',
      conductor_id: 'cond-1',
      deleted_at: null,
      ...scopeUsuarioConductor,
    });
  });

  it('no afloja el scope cuando cambia el conductor de la sesión', async () => {
    await findAsignacionForConductor(
      { ...session, conductorId: 'cond-2', userId: 'user-cond-2', tenantId: 'tenant-2' },
      'reserva-9',
    );
    const arg = findFirst.mock.calls[0]?.[0];
    expect(arg.where.tenant_id).toBe('tenant-2');
    expect(arg.where.conductor_id).toBe('cond-2');
    expect(arg.where.conductor.usuario.id).toBe('user-cond-2');
  });
});
