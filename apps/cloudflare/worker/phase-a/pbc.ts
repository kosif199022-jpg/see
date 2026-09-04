import { validatePbcTransition, type AuditActorRole, type PbcStatus } from '../../../../packages/domain/src/lifecycle';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) =>
  respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
async function jsonBody<T>(request: Request): Promise<T> { return (await request.json()) as T; }

export async function handlePbcRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const engagementMatch = path.match(/^\/api\/v1\/engagements\/([^/]+)\/pbc$/);
  if (engagementMatch && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM pbc_requests WHERE engagement_id = ? ORDER BY created_at DESC')
      .bind(engagementMatch[1]).all();
    return respond({ requests: result.results ?? [] });
  }

  if (engagementMatch && request.method === 'POST') {
    const engagementId = engagementMatch[1];
    const engagement = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const input = await jsonBody<{ title?: string; description?: string; priority?: string; dueAt?: string; createdBy?: string }>(request);
    if (!input.title?.trim()) return problem('PBC_TITLE_REQUIRED', 'PBC title is required');
    const priority = ['low', 'medium', 'high', 'critical'].includes(input.priority ?? '') ? input.priority! : 'medium';
    const id = phaseAId();
    const at = phaseANow();
    const actor = input.createdBy?.trim() || 'pilot-user';
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO pbc_requests
          (id, engagement_id, title, description, priority, status, due_at, revision, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'draft', ?, 1, ?, ?, ?)
      `).bind(id, engagementId, input.title.trim(), input.description?.trim() ?? '', priority, input.dueAt?.trim() || null, actor, at, at),
      auditEventStatement(env, {
        engagementId, entityType: 'pbc_request', entityId: id, action: 'pbc.created', actor, occurredAt: at,
        payload: { title: input.title.trim(), priority, dueAt: input.dueAt?.trim() || null },
      }),
    ]);
    return respond({ id, status: 'draft', revision: 1 }, 201);
  }

  const transitionMatch = path.match(/^\/api\/v1\/pbc\/([^/]+)\/transitions$/);
  if (transitionMatch && request.method === 'POST') {
    const input = await jsonBody<{ to?: PbcStatus; actorRole?: AuditActorRole; actor?: string }>(request);
    if (!input.to) return problem('PBC_TRANSITION_REQUIRED', 'to is required');
    const row = await env.DB.prepare('SELECT * FROM pbc_requests WHERE id = ?').bind(transitionMatch[1]).first<Record<string, unknown>>();
    if (!row) return problem('PBC_NOT_FOUND', 'PBC request not found', 404);
    const from = String(row.status) as PbcStatus;
    const decision = validatePbcTransition(from, input.to);
    if (!decision.allowed) return problem('PBC_TRANSITION_BLOCKED', 'PBC transition is blocked', 409, { blockers: decision.blockers });
    if (['accepted', 'rejected'].includes(input.to) && (!input.actorRole || input.actorRole === 'ai_agent')) {
      return problem('PBC_HUMAN_REVIEW_REQUIRED', 'Human reviewer is required to accept or reject PBC evidence', 409);
    }
    const at = phaseANow();
    const actor = input.actor?.trim() || `pilot:${input.actorRole ?? 'senior'}`;
    const revision = Number(row.revision ?? 1) + 1;
    await env.DB.batch([
      env.DB.prepare('UPDATE pbc_requests SET status = ?, revision = ?, updated_at = ? WHERE id = ? AND status = ?')
        .bind(input.to, revision, at, transitionMatch[1], from),
      auditEventStatement(env, {
        engagementId: String(row.engagement_id), entityType: 'pbc_request', entityId: transitionMatch[1],
        action: 'pbc.transitioned', actor, occurredAt: at, payload: { from, to: input.to, revision },
      }),
    ]);
    return respond({ id: transitionMatch[1], from, to: input.to, revision });
  }

  return null;
}
