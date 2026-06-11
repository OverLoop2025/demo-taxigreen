import { env } from '@/lib/env';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const baseUrl = env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');

// Códigos internos del backend → mensaje legible para el chofer. El código crudo
// sigue disponible en `ApiError.payload` para quien necesite ramificar lógica.
const MENSAJES_POR_CODIGO: Record<string, string> = {
  counter_pendiente: 'El counter aún no valida el pase del pasajero. Te avisaremos con la luz verde.',
  transicion_invalida: 'El viaje cambió de estado en el sistema. Actualizamos la información.',
  asignacion_no_encontrada: 'Este viaje ya no está asignado a tu usuario.',
  viaje_no_encontrado: 'No encontramos el viaje en el sistema.',
  unauthorized: 'Tu sesión expiró. Vuelve a iniciar sesión.',
};

function mensajeHumano(codigo: string): string {
  const mapeado = MENSAJES_POR_CODIGO[codigo];
  if (mapeado) return mapeado;
  // Jerga interna (snake_case, sin espacios) nunca se muestra cruda en pantalla.
  return codigo.includes(' ') ? codigo : 'No se pudo completar la operación.';
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? mensajeHumano(payload.error)
        : 'No se pudo completar la operación.';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
