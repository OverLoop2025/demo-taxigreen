import type { Prisma } from '@taxigreen/database';

export type AuditHeadersLike =
  | Record<string, string | string[] | undefined>
  | {
      get(name: string): string | null;
    };

export type AuditActor = {
  tipo: 'sistema' | 'usuario' | 'conductor' | 'pasajero' | 'llm';
  id?: string | null;
};

export type AuditTarget = {
  table?: string | null;
  id?: string | null;
};

export type FuenteDecision = {
  fuente: 'algoritmo' | 'llm';
  motivo?: string | null;
  modelo?: string | null;
};

export type AuditRequestLike = {
  headers?: AuditHeadersLike;
  ip?: string | null;
};

export type RecordAuditInput = {
  actor: AuditActor;
  action: string;
  payload?: Prisma.InputJsonValue;
  target?: AuditTarget;
  tenantId?: string | null;
  req?: AuditRequestLike;
  fuenteDecision?: FuenteDecision | null;
};
