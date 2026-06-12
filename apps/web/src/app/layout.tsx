import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ThemeProvider, themeNoFlashScript } from '@/components/theme/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taxi Green',
  description: 'Pide tu Taxi Green, te esperamos en el punto exacto y sigues tu viaje en vivo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
