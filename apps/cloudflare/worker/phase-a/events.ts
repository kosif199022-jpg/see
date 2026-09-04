import type { PhaseAEnv } from './types';

export const phaseANow = () => new Date().toISOString();
export const phaseAId = () => crypto.randomUUID();

export async function appendAuditEvent(
  env: PhaseAEnv,
  input: {
    engagementId: string;
    entityType: string;
    entityId: string;
    action: string;
    actor: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await env.DB.prepare(`
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
    phaseANow(),
  ).run();
}
