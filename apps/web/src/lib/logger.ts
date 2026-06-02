import pino from 'pino';

/** Logger Pino (servidor). En MVP se añade OpenTelemetry; en demo basta Pino + Sentry. */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
});
