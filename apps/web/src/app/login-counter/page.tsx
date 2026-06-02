import { LoginForm } from '@/components/auth/login-form';

export default async function LoginCounterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      callbackUrl={params.callbackUrl ?? '/counter'}
      subtitle="Acceso del supervisor de módulo"
      title="Counter Aeropuerto"
    />
  );
}
