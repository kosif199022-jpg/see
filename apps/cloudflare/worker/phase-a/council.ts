import { validateCouncilTransition, type AuditActorRole, type CouncilStatus } from '../../../../packages/domain/src/lifecycle';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) =>
  respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
async function jsonBody<T>(request: Request): Promise<T> { return (await request.json()) as T; }

const HUMAN_REVIEW_ROLES: AuditActorRole[] = ['partner', 'manager', 'senior', 'quality_reviewer'];
const FORBIDDEN_SYNTHESIS_KEYS = ['calculated_materiality', 'final_opinion', 'approved_adjustment', 'posted_entry', 'archive_lock'];

function synthesisHasForbiddenAuthority(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const serialized = JSON.stringify(value);
  return FORBIDDEN_SYNTHESIS_KEYS.some((key) => serialized.includes(`\"${key}\"`));
}

export async function handleCouncilRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const listMatch = path.match(/^\/api\/v1\/engagements\/([^/]+)\/council-runs$/);
  if (listMatch && request.method === 'GET') {
    const result = await env.DB.prepare(`
      SELECT id, engagement_id, status, task, evidence_snapshot_json, synthesis_json,
             human_decision, human_rationale, created_by, created_at, reviewed_at
      FROM council_runs WHERE engagement_id = ? ORDER BY created_at DESC
    `).bind(listMatch[1]).all();
    return respond({ runs: result.results ?? [] });
  }

  if (listMatch && request.method === 'POST') {
    const engagementId = listMatch[1];
    const input = await jsonBody<{ task?: string; evidenceIds?: string[]; createdBy?: string }>(request);
    if (!input.task?.trim()) return problem('COUNCIL_TASK_REQUIRED', 'Council task is required');
    const evidenceIds = [...new Set((input.evidenceIds ?? []).filter(Boolean))];
    if (evidenceIds.length === 0) return problem('COUNCIL_EVIDENCE_REQUIRED', 'At least one evidence item is required for a Council run');
    const placeholders = evidenceIds.map(() => '?').join(',');
    const evidence = await env.DB.prepare(`
      SELECT id, name, sha256, status FROM evidence
      WHERE engagement_id = ? AND id IN (${placeholders}) ORDER BY id
    `).bind(engagementId, ...evidenceIds).all<Record<string, unknown>>();
    if ((evidence.results ?? []).length !== evidenceIds.length) return problem('COUNCIL_EVIDENCE_NOT_FOUND', 'One or more evidence items are not available in this engagement', 404);
    const id = phaseAId(); const at = phaseANow(); const actor = input.createdBy?.trim() || 'pilot-user';
    const snapshot = (evidence.results ?? []).map((row) => ({ id: row.id, name: row.name, sha256: row.sha256, status: row.status }));
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO council_runs (id, engagement_id, status, task, evidence_snapshot_json, created_by, created_at)
        VALUES (?, ?, 'prepared', ?, ?, ?, ?)
      `).bind(id, engagementId, input.task.trim(), JSON.stringify(snapshot), actor, at),
      auditEventStatement(env, {
        engagementId, entityType: 'council_run', entityId: id, action: 'council.prepared', actor, occurredAt: at,
        payload: { evidenceIds, task: input.task.trim() },
      }),
    ]);
    return respond({ id, status: 'prepared', evidenceSnapshot: snapshot, authority: 'advisory' }, 201);
  }

  const transitionMatch = path.match(/^\/api\/v1\/council-runs\/([^/]+)\/transitions$/);
  if (transitionMatch && request.method === 'POST') {
    const run = await env.DB.prepare('SELECT * FROM council_runs WHERE id = ?').bind(transitionMatch[1]).first<Record<string, unknown>>();
    if (!run) return problem('COUNCIL_RUN_NOT_FOUND', 'Council run not found', 404);
    const input = await jsonBody<{
      to?: CouncilStatus; actorRole?: AuditActorRole; actor?: string; synthesis?: unknown; humanDecision?: string; humanRationale?: string;
    }>(request);
    if (!input.to || !input.actorRole) return problem('COUNCIL_TRANSITION_REQUIRED', 'to and actorRole are required');
    const from = String(run.status) as CouncilStatus;
    const decision = validateCouncilTransition(from, input.to, { actorRole: input.actorRole });
    if (!decision.allowed) return problem('COUNCIL_TRANSITION_BLOCKED', 'Council transition is blocked', 409, { blockers: decision.blockers });
    if (input.to === 'synthesized' && synthesisHasForbiddenAuthority(input.synthesis)) {
      return problem('COUNCIL_FORBIDDEN_AUTHORITY', 'Council synthesis contains a forbidden authority field', 409);
    }
    if (input.to === 'human_reviewed') {
      if (!HUMAN_REVIEW_ROLES.includes(input.actorRole)) return problem('HUMAN_REVIEW_REQUIRED', 'Authorized human reviewer is required', 409);
      if (!input.humanDecision?.trim() || !input.humanRationale?.trim()) {
        return problem('HUMAN_DECISION_REQUIRED', 'Human decision and rationale are required', 400);
      }
    }
    const actor = input.actor?.trim() || `pilot:${input.actorRole}`; const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE council_runs
        SET status = ?,
            synthesis_json = CASE WHEN ? = 'synthesized' THEN ? ELSE synthesis_json END,
            human_decision = CASE WHEN ? = 'human_reviewed' THEN ? ELSE human_decision END,
            human_rationale = CASE WHEN ? = 'human_reviewed' THEN ? ELSE human_rationale END,
            reviewed_at = CASE WHEN ? = 'human_reviewed' THEN ? ELSE reviewed_at END
        WHERE id = ? AND status = ?
      `).bind(
        input.to,
        input.to, input.synthesis === undefined ? null : JSON.stringify(input.synthesis),
        input.to, input.humanDecision?.trim() || null,
        input.to, input.humanRationale?.trim() || null,
        input.to, at,
        transitionMatch[1], from,
      ),
      auditEventStatement(env, {
        engagementId: String(run.engagement_id), entityType: 'council_run', entityId: transitionMatch[1], action: 'council.transitioned', actor, occurredAt: at,
        payload: { from, to: input.to, authority: 'advisory' },
      }),
    ]);
    return respond({ id: transitionMatch[1], from, to: input.to, authority: 'advisory' });
  }

  return null;
}
