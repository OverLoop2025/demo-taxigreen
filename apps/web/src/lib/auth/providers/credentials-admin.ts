import { recordAudit } from '@taxigreen/auditoria';
import { prisma, Rol } from '@taxigreen/database';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { assertLoginAllowed, clearLoginAttempts, registerFailedLogin } from '../rate-limit';
import { verifyPassword } from '../passwords';

const schema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

const allowedRoles = new Set<Rol>([Rol.admin_tenant, Rol.despachador, Rol.supervisor]);

function invalidCredentials(key?: string): never {
  if (key) registerFailedLogin(key);
  throw new Error('credenciales inválidas');
}

export const credentialsAdminProvider = Credentials({
  id: 'credentials-admin',
  name: 'Admin Taxi Green',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  authorize: async (credentials) => {
    const parsed = schema.safeParse(credentials);
    if (!parsed.success) invalidCredentials();

    const key = `admin:${parsed.data.email}`;
    assertLoginAllowed(key);

    const user = await prisma.usuarios.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user || !user.activo || user.deleted_at || !allowedRoles.has(user.rol)) {
      invalidCredentials(key);
    }

    const passwordOk = await verifyPassword(parsed.data.password, user.password_hash);
    if (!passwordOk) invalidCredentials(key);

    clearLoginAttempts(key);
    await recordAudit({
      actor: { tipo: 'usuario', id: user.id },
      action: user.rol === Rol.supervisor ? 'login_counter' : 'login_admin',
      target: { table: 'usuarios', id: user.id },
      tenantId: user.tenant_id,
      payload: { email: user.email, rol: user.rol },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.nombre,
      role: user.rol,
      tenantId: user.tenant_id,
    };
  },
});
