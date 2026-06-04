if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  process.env.CI !== 'true' &&
  !process.env.AUTH_SECRET
) {
  throw new Error('AUTH_SECRET es obligatorio en runtime de producción.');
}

export const AUTH_SECRET = process.env.AUTH_SECRET ?? 'taxigreen-demo-dev-secret-change-before-production';
