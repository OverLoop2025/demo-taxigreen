/**
 * BrandHeader.
 * Chrome AZUL del producto; el verde Taxi Green queda reservado al logo/chip de
 * tenant (no se aplica como color de sistema).
 */
export function BrandHeader() {
  return (
    <header className="flex items-center justify-between bg-product-deep px-6 py-4 text-white">
      <div className="flex items-center gap-3">
        {/* Chip de tenant: único lugar donde aparece el verde de marca. */}
        <span className="rounded bg-brand-tenant px-2 py-1 text-xs font-semibold">Taxi Green</span>
        <span className="text-sm opacity-80">Demo en vivo</span>
      </div>
      <span className="text-xs opacity-60">Demo final</span>
    </header>
  );
}
