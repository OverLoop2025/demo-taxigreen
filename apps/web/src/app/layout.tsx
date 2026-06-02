import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/toast-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taxi Green — Demo',
  description: 'Operación trazable de taxi aeroportuario (demo). Sprint 1.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
