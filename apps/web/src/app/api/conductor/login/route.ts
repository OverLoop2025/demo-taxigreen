import { NextResponse } from 'next/server';
import { recordAudit } from '@taxigreen/auditoria';
import { prisma, Rol } from '@taxigreen/database';
import { z } from 'zod';
import {
  CONDUCTOR_TOKEN_EXPIRES_IN_SECONDS,
  createConductorToken,
} from '@/lib/conductor-token';
import { verifyPin } from '@/lib/auth/pin';
import { assertLoginAllowed, clearLoginAttempts, registerFailedLogin } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  pin: z.string().regex(/^\d{4}$/),
});

function invalidCredentials(key?: string) {
  if (key) registerFailedLogin(key);
  return NextResponse.json({ error: 'credenciales inválidas' }, { status: 401 });
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return invalidCredentials();
  }

  const key = `driver-mobile:${parsed.data.email}`;
  try {
    assertLoginAllowed(key);
  } catch {
    return invalidCredentials();
  }

  const user = await prisma.usuarios.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      tenant_id: true,
      rol: true,
      email: true,
      nombre: true,
      telefono: true,
      pin_hash: true,
      activo: true,
      deleted_at: true,
      conductor: {
        select: {
          id: true,
          licencia: true,
          rating: true,
          total_viajes: true,
          vehiculo: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true,
              tipo: true,
              capacidad: true,
              color: true,
              anio: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.activo || user.deleted_at || user.rol !== Rol.conductor || !user.conductor) {
    return invalidCredentials(key);
  }

  const pinOk = await verifyPin(parsed.data.pin, user.pin_hash);
  if (!pinOk) {
    return invalidCredentials(key);
  }

  clearLoginAttempts(key);
  const email = user.email ?? parsed.data.email;
  const token = await createConductorToken({
    userId: user.id,
    tenantId: user.tenant_id,
    conductorId: user.conductor.id,
    email,
    nombre: user.nombre,
    role: 'conductor',
  });

  await recordAudit({
    actor: { tipo: 'conductor', id: user.conductor.id },
    action: 'login_driver_mobile',
    target: { table: 'conductores', id: user.conductor.id },
    tenantId: user.tenant_id,
    req: { headers: request.headers },
    payload: {
      email,
      canal: 'expo_driver',
    },
  });

  return NextResponse.json({
    token,
    expiresIn: CONDUCTOR_TOKEN_EXPIRES_IN_SECONDS,
    conductor: {
      userId: user.id,
      conductorId: user.conductor.id,
      tenantId: user.tenant_id,
      nombre: user.nombre,
      email,
      telefono: user.telefono,
      licencia: user.conductor.licencia,
      rating: user.conductor.rating,
      totalViajes: user.conductor.total_viajes,
      vehiculo: user.conductor.vehiculo,
    },
  });
}
