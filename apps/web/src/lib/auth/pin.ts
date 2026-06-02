import { compare, hash } from 'bcryptjs';
import { bytesToHash, resolveBcryptCost } from './passwords';

const PIN_PATTERN = /^\d{4}$/;

export function isValidPin(pin: string) {
  return PIN_PATTERN.test(pin);
}

export async function hashPin(pin: string, cost = resolveBcryptCost()) {
  if (!isValidPin(pin)) {
    throw new Error('PIN inválido');
  }
  return hash(pin, cost);
}

export async function verifyPin(pin: string, pinHash: string | Uint8Array | null | undefined) {
  if (!isValidPin(pin)) return false;
  const storedHash = bytesToHash(pinHash);
  if (!storedHash) return false;
  return compare(pin, storedHash);
}
