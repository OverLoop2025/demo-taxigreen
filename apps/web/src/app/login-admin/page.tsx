import { LoginForm } from '@/components/auth/login-form';

export default async function LoginAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      callbackUrl={params.callbackUrl ?? '/admin'}
      subtitle="Acceso del operador y despachador"
      title="Despacho Taxi Green"
    />
  );
}
