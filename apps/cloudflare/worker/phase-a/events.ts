import type { PhaseAEnv } from './types';

export const phaseANow = () => new Date().toISOString();
export const phaseAId = () => crypto.randomUUID();

export interface AuditEventInput {
  engagementId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}

export function auditEventStatement(env: PhaseAEnv, input: AuditEventInput): D1PreparedStatement {
  return env.DB.prepare(`
    INSERT INTO audit_events
      (id, engagement_id, entity_type, entity_id, action, payload_json, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    phaseAId(),
    input.engagementId,
    input.entityType,
    input.entityId,
    input.action,
    JSON.stringify(input.payload ?? {}),
    input.actor,
    input.occurredAt ?? phaseANow(),
  );
}

export async function appendAuditEvent(env: PhaseAEnv, input: AuditEventInput): Promise<void> {
  await auditEventStatement(env, input).run();
}
