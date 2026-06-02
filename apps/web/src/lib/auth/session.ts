import { redirect } from 'next/navigation';
import { auth } from './config';

export async function getCurrentSession() {
  return auth();
}

export async function requireRole(roles: string[], redirectTo = '/login-admin') {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user || !role || !roles.includes(role)) {
    redirect(redirectTo);
  }

  return session;
}
