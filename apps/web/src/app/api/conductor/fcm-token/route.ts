import { NextResponse } from 'next/server';
import { recordAudit } from '@taxigreen/auditoria';
import { prisma, Rol } from '@taxigreen/database';
import { z } from 'zod';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  token: z.string().min(8).max(512),
  plataforma: z.enum(['expo', 'fcm', 'desconocida']).default('expo'),
});

export async function POST(request: Request) {
  const bearer = bearerTokenFromRequest(request);
  const session = bearer ? await verifyConductorToken(bearer) : null;
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
  }

  const user = await prisma.usuarios.findFirst({
    where: {
      id: session.userId,
      tenant_id: session.tenantId,
      rol: Rol.conductor,
      activo: true,
      deleted_at: null,
      conductor: { is: { id: session.conductorId } },
    },
    select: { id: true, tenant_id: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await prisma.usuarios.update({
    where: { id: user.id },
    data: { fcm_token: parsed.data.token },
  });

  await recordAudit({
    actor: { tipo: 'conductor', id: session.conductorId },
    action: 'driver_push_token_registrado',
    target: { table: 'usuarios', id: user.id },
    tenantId: user.tenant_id,
    req: { headers: request.headers },
    payload: {
      plataforma: parsed.data.plataforma,
      token_prefijo: parsed.data.token.slice(0, 18),
    },
  });

  return NextResponse.json({ ok: true });
}
