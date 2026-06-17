import { cn } from '@/lib/utils';

/**
 * Crédito de autoría, presente en todo el sistema (web y, en espejo, en la app móvil).
 * Resaltado de forma adaptativa: el nombre usa `text-foreground` (tono oscuro en modo
 * claro, tono claro en modo oscuro) para que la marca personal lea bien sin gritar.
 */
export function AuthorCredit({ className }: { className?: string }) {
  return (
    <p className={cn('text-[12px] leading-5 text-foreground-muted', className)}>
      <span className="text-foreground-muted/70">Developed by </span>
      <a
        className="font-semibold text-foreground underline-offset-2 transition hover:text-product hover:underline"
        href="https://github.com/OverLoop2025"
        rel="noreferrer"
        target="_blank"
      >
        José Álvarez
      </a>
      <span className="px-1.5 text-foreground-muted/40">·</span>
      <a
        className="text-foreground-muted underline-offset-2 transition hover:text-product hover:underline"
        href="https://github.com/OverLoop2025"
        rel="noreferrer"
        target="_blank"
      >
        github.com/OverLoop2025
      </a>
      <span className="px-1.5 text-foreground-muted/40">·</span>
      <span className="text-foreground-muted">959 799 190</span>
    </p>
  );
}
