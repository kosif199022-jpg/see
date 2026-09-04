import {
  validateEngagementTransition,
  type AuditActorRole,
  type EngagementStatus,
} from '../../../../packages/domain/src/lifecycle';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) =>
  respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);

async function jsonBody<T>(request: Request): Promise<T> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) throw new Error('Expected application/json');
  return (await request.json()) as T;
}

async function closurePrerequisites(env: PhaseAEnv, engagementId: string): Promise<string[]> {
  const [report, evidence, notes, risks] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM report_versions WHERE engagement_id = ? AND status = 'approved'").bind(engagementId).first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM evidence WHERE engagement_id = ?').bind(engagementId).first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM review_notes WHERE engagement_id = ? AND status = 'open'").bind(engagementId).first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM risks WHERE engagement_id = ? AND level = 'high' AND status != 'closed'").bind(engagementId).first<{ count: number }>(),
  ]);
  const prerequisites: string[] = [];
  if ((report?.count ?? 0) > 0) prerequisites.push('REPORT_APPROVED');
  if ((evidence?.count ?? 0) > 0) prerequisites.push('EVIDENCE_SUFFICIENT');
  if ((notes?.count ?? 0) === 0) prerequisites.push('OPEN_REVIEW_NOTES_ZERO');
  if ((risks?.count ?? 0) === 0) prerequisites.push('OPEN_HIGH_RISKS_ZERO');
  return prerequisites;
}

export async function handleLifecycleRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const match = path.match(/^\/api\/v1\/engagements\/([^/]+)\/transitions$/);
  if (!match || request.method !== 'POST') return null;

  const engagementId = match[1];
  const input = await jsonBody<{
    to?: EngagementStatus;
    actorRole?: AuditActorRole;
    reason?: string;
    expectedStatus?: EngagementStatus;
  }>(request);
  if (!input.to || !input.actorRole) return problem('TRANSITION_INPUT_REQUIRED', 'to and actorRole are required');

  const engagement = await env.DB.prepare('SELECT id, status FROM engagements WHERE id = ?')
    .bind(engagementId)
    .first<{ id: string; status: EngagementStatus }>();
  if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
  if (input.expectedStatus && input.expectedStatus !== engagement.status) {
    return problem('ENGAGEMENT_STATUS_CONFLICT', 'Engagement status changed; refresh before retrying', 409, { currentStatus: engagement.status });
  }

  const prerequisites = input.to === 'archived' ? await closurePrerequisites(env, engagementId) : [];
  const decision = validateEngagementTransition(engagement.status, input.to, {
    actorRole: input.actorRole,
    prerequisites,
    reason: input.reason,
  });
  if (!decision.allowed) return problem('TRANSITION_BLOCKED', 'Professional transition is blocked', 409, { blockers: decision.blockers });

  const revisionRow = await env.DB.prepare('SELECT COALESCE(MAX(revision), 0) AS revision FROM engagement_revisions WHERE engagement_id = ?')
    .bind(engagementId)
    .first<{ revision: number }>();
  const revision = (revisionRow?.revision ?? 0) + 1;
  const occurredAt = phaseANow();
  const revisionId = phaseAId();
  const actor = `pilot:${input.actorRole}`;

  await env.DB.batch([
    env.DB.prepare('UPDATE engagements SET status = ? WHERE id = ? AND status = ?')
      .bind(input.to, engagementId, engagement.status),
    env.DB.prepare(`
      INSERT INTO engagement_revisions
        (id, engagement_id, revision, from_status, to_status, reason, actor, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(revisionId, engagementId, revision, engagement.status, input.to, input.reason?.trim() ?? '', actor, occurredAt),
    auditEventStatement(env, {
      engagementId,
      entityType: 'engagement',
      entityId: engagementId,
      action: 'engagement.transitioned',
      actor,
      occurredAt,
      payload: { from: engagement.status, to: input.to, revision, reason: input.reason?.trim() ?? '' },
    }),
  ]);

  return respond({ engagementId, from: engagement.status, to: input.to, revision, blockers: [] });
}
