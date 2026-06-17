import Link from 'next/link';
import { AuthorCredit } from '@/components/brand/author-credit';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { cn } from '@/lib/utils';

type FooterLink = { href: string; label: string };

const defaultLinks: FooterLink[] = [
  { href: '/wa-sim', label: 'WhatsApp' },
  { href: '/counter', label: 'Mostrador' },
  { href: '/login-admin', label: 'Operadores' },
];

/**
 * Footer ÚNICO y uniforme para todas las superficies web (landing, counter, admin).
 * Resuelve el "doble footer": una sola pieza con marca + accesos a la izquierda y, bajo
 * una hairline sobria, el crédito de autoría dentro de un chip con borde delgado discreto.
 * La textura cult-ui (grid) aporta profundidad casi imperceptible sin competir con la marca.
 */
export function SiteFooter({
  className,
  links = defaultLinks,
}: {
  className?: string;
  links?: FooterLink[];
}) {
  return (
    <footer className={cn('relative isolate mt-auto overflow-hidden border-t border-border bg-surface/50', className)}>
      <TextureOverlay className="text-foreground" opacity={0.035} texture="grid" />
      {/* Una sola fila: la marca personal (resaltada, dentro de un chip sobrio) a la
          izquierda y los accesos a la derecha. Sin segundo renglón. */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 lg:px-8">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-3.5 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur">
          <AuthorCredit />
        </span>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
          {links.map((link) => (
            <Link
              className="text-product underline-offset-4 transition hover:text-product-500 hover:underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
