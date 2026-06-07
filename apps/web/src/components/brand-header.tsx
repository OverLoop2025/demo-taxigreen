import { ThemeToggle } from '@/components/theme/theme-toggle';

/**
 * BrandHeader.
 * Chrome verde esmeralda del producto (identidad unificada 2026-06-07); el chip de
 * tenant mantiene el verde de marca. Incluye el cambio claro/oscuro de forma discreta.
 */
export function BrandHeader() {
  return (
    <header className="flex items-center justify-between bg-product-deep px-6 py-4 text-white">
      <div className="flex items-center gap-3">
        {/* Chip de tenant. */}
        <span className="rounded bg-brand-tenant px-2 py-1 text-xs font-semibold">Taxi Green</span>
        <span className="text-sm opacity-80">Demo en vivo</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs opacity-60">Demo final</span>
        <ThemeToggle className="h-8 w-8 border-white/25 bg-white/10 text-white hover:bg-white/20" />
      </div>
    </header>
  );
}
