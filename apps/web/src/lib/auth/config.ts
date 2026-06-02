import NextAuth from 'next-auth';
import { credentialsAdminProvider } from './providers/credentials-admin';
import { credentialsDriverProvider } from './providers/credentials-driver';
import { AUTH_SECRET } from './secret';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: AUTH_SECRET,
  trustHost: true,
  providers: [credentialsAdminProvider, credentialsDriverProvider],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login-admin',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.conductorId = user.conductorId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = String(token.id);
        if (token.role) session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.conductorId = token.conductorId;
      }
      return session;
    },
  },
});
