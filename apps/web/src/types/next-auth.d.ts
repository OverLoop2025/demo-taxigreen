import type { Rol } from '@taxigreen/database';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    role: Rol;
    tenantId?: string | null;
    conductorId?: string;
  }

  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role?: Rol;
      tenantId?: string | null;
      conductorId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Rol;
    tenantId?: string | null;
    conductorId?: string;
  }
}
