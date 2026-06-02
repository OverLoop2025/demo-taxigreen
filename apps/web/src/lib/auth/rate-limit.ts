const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; firstAttemptAt: number }>();

function currentBucket(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    const fresh = { count: 0, firstAttemptAt: now };
    attempts.set(key, fresh);
    return fresh;
  }
  return entry;
}

export function assertLoginAllowed(key: string) {
  const bucket = currentBucket(key);
  if (bucket.count >= MAX_ATTEMPTS) {
    throw new Error('credenciales inválidas');
  }
}

export function registerFailedLogin(key: string) {
  const bucket = currentBucket(key);
  bucket.count += 1;
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}
