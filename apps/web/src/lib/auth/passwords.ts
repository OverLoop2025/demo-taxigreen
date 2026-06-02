import { compare, hash } from 'bcryptjs';

const RUNTIME_COST = 12;
const TEST_COST = 4;

export function resolveBcryptCost() {
  return process.env.NODE_ENV === 'test' ? TEST_COST : RUNTIME_COST;
}

export async function hashPassword(password: string, cost = resolveBcryptCost()) {
  return hash(password, cost);
}

export async function verifyPassword(password: string, passwordHash: string | Uint8Array | null | undefined) {
  const storedHash = bytesToHash(passwordHash);
  if (!storedHash) return false;
  return compare(password, storedHash);
}

export function hashToBytes(value: string) {
  return Buffer.from(value, 'utf8');
}

export function bytesToHash(value: string | Uint8Array | null | undefined) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return Buffer.from(value).toString('utf8');
}
