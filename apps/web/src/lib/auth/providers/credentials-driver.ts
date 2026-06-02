import { recordAudit } from '@taxigreen/auditoria';
import { prisma, Rol } from '@taxigreen/database';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { verifyPin } from '../pin';
import { assertLoginAllowed, clearLoginAttempts, registerFailedLogin } from '../rate-limit';

const schema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  pin: z.string().regex(/^\d{4}$/),
});

function invalidCredentials(key?: string): never {
  if (key) registerFailedLogin(key);
  throw new Error('credenciales inválidas');
}

export const credentialsDriverProvider = Credentials({
  id: 'credentials-driver',
  name: 'Conductor Taxi Green',
  credentials: {
    email: { label: 'Email', type: 'email' },
    pin: { label: 'PIN', type: 'password' },
  },
  authorize: async (credentials) => {
    const parsed = schema.safeParse(credentials);
    if (!parsed.success) invalidCredentials();

    const key = `driver:${parsed.data.email}`;
    assertLoginAllowed(key);

    const user = await prisma.usuarios.findUnique({
      where: { email: parsed.data.email },
      include: { conductor: true },
    });

    if (!user || !user.activo || user.deleted_at || user.rol !== Rol.conductor || !user.conductor) {
      invalidCredentials(key);
    }

    const pinOk = await verifyPin(parsed.data.pin, user.pin_hash);
    if (!pinOk) invalidCredentials(key);

    clearLoginAttempts(key);
    await recordAudit({
      actor: { tipo: 'conductor', id: user.conductor.id },
      action: 'login_driver',
      target: { table: 'conductores', id: user.conductor.id },
      tenantId: user.tenant_id,
      payload: { email: user.email },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.nombre,
      role: user.rol,
      tenantId: user.tenant_id,
      conductorId: user.conductor.id,
    };
  },
});
