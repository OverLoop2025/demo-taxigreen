import 'server-only';

/**
 * Token de Mapbox apto para el NAVEGADOR, resuelto en el servidor.
 *
 * En producción `NEXT_PUBLIC_MAPBOX_TOKEN` no siempre llega al bundle del cliente
 * (no es build-time public var en Railway), así que las superficies de mapa lo
 * reciben como prop desde un Server Component. Como fallback usamos el token
 * `MAPBOX_SERVER_TOKEN` siempre que sea un token público (`pk.*`), que es seguro
 * exponer al navegador. Esto unifica `/p`, `/ubicacion` y `/wa-sim`.
 */
export function getMapboxBrowserToken(): string | null {
  const explicitPublicToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (explicitPublicToken?.startsWith('pk.')) return explicitPublicToken;
  const reusableToken = process.env.MAPBOX_SERVER_TOKEN;
  if (reusableToken?.startsWith('pk.')) return reusableToken;
  return null;
}
