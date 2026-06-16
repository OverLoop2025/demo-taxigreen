import { cn } from '@/lib/utils';

/**
 * Crédito de autoría discreto, presente en todo el sistema (web y, en espejo, en la
 * app móvil). Sutil por diseño: no compite con la marca Taxi Green.
 */
export function AuthorCredit({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11px] leading-5 text-foreground-muted/60', className)}>
      Developed by{' '}
      <a
        className="font-semibold text-foreground-muted/80 underline-offset-2 transition hover:text-product hover:underline"
        href="https://github.com/OverLoop2025"
        rel="noreferrer"
        target="_blank"
      >
        José Álvarez
      </a>
      <span className="px-1 opacity-50">·</span>
      <a
        className="underline-offset-2 transition hover:text-product hover:underline"
        href="https://github.com/OverLoop2025"
        rel="noreferrer"
        target="_blank"
      >
        github.com/OverLoop2025
      </a>
      <span className="px-1 opacity-50">·</span>
      959 799 190
    </p>
  );
}
