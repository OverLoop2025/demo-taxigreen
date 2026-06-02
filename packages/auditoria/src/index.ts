import { Prisma, prisma } from '@taxigreen/database';
import type { AuditHeadersLike, RecordAuditInput } from './types';

type HeaderRecord = Record<string, string | string[] | undefined>;

function isHeadersGetter(headers: AuditHeadersLike): headers is { get(name: string): string | null } {
  return 'get' in headers && typeof headers.get === 'function';
}

function headerValue(req: RecordAuditInput['req'], name: string) {
  const headers = req?.headers;
  if (!headers) return undefined;

  if (isHeadersGetter(headers)) {
    return headers.get(name) ?? undefined;
  }

  const headerRecord: HeaderRecord = headers;
  const value = headerRecord[name] ?? headerRecord[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value;
}

function requestIp(req: RecordAuditInput['req']) {
  return (
    req?.ip ??
    headerValue(req, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    headerValue(req, 'x-real-ip') ??
    null
  );
}

export async function recordAudit({
  actor,
  action,
  payload,
  target,
  tenantId,
  req,
  fuenteDecision,
}: RecordAuditInput) {
  return prisma.auditoria.create({
    data: {
      tenant_id: tenantId ?? null,
      actor_tipo: actor.tipo,
      actor_id: actor.id ?? null,
      action,
      target_table: target?.table ?? null,
      target_id: target?.id ?? null,
      payload,
      fuente_decision: fuenteDecision ?? Prisma.JsonNull,
      ip: requestIp(req),
      user_agent: headerValue(req, 'user-agent') ?? null,
    },
  });
}

export type { AuditActor, AuditTarget, FuenteDecision, RecordAuditInput } from './types';
