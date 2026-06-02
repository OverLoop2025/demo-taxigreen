/**
 * Sentry — DUMMY en demo (PLAN_SOFTWARE §2.3: sin Sentry source maps en demo).
 * Mantiene la superficie de API para sustituir por @sentry/nextjs real en MVP
 * sin tocar los call sites.
 */
export const sentry = {
  captureException(error: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[sentry:dummy] captureException', error);
    }
  },
  captureMessage(message: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sentry:dummy] captureMessage', message);
    }
  },
};
