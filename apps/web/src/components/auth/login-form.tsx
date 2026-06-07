'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginValues = z.infer<typeof schema>;

function normalizeCallbackPath(value: string, fallback = '/admin') {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) {
    return value;
  }

  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function LoginForm({
  title,
  subtitle,
  callbackUrl,
}: {
  title: string;
  subtitle: string;
  callbackUrl: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const safeCallbackUrl = normalizeCallbackPath(callbackUrl);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setError(null);
    const result = await signIn('credentials-admin', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: safeCallbackUrl,
    });

    if (result?.error) {
      setError('credenciales inválidas');
      return;
    }

    router.push(safeCallbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded bg-brand-tenant px-2 py-1 text-xs font-semibold text-white">
            Taxi Green
          </div>
          <h1 className="text-2xl font-semibold text-product-deep dark:text-product-200">{title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">{subtitle}</p>
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" autoComplete="email" type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-danger">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              autoComplete="current-password"
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-danger">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Ingresar
          </Button>
        </form>
      </section>
    </main>
  );
}
