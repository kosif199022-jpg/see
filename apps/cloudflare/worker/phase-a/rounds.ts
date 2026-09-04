import { AUDIT_ROUNDS, isRoundCode, validateRoundDecision, type RoundStatus } from '../../../../packages/audit-engine/src/rounds';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) => respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
async function body<T>(request: Request): Promise<T> { return (await request.json()) as T; }

export async function handleRoundsRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const match = path.match(/^\/api\/v1\/engagements\/([^/]+)\/rounds$/);
  if (!match) return null;
  const engagementId = match[1];

  if (request.method === 'GET') {
    const engagement = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const decisions = await env.DB.prepare(`
      SELECT rd.* FROM round_decisions rd
      JOIN (
        SELECT round_code, MAX(version) AS version
        FROM round_decisions WHERE engagement_id = ? GROUP BY round_code
      ) latest ON latest.round_code = rd.round_code AND latest.version = rd.version
      WHERE rd.engagement_id = ?
    `).bind(engagementId, engagementId).all<Record<string, unknown>>();
    const byCode = new Map((decisions.results ?? []).map((item) => [String(item.round_code), item]));
    return respond({
      rounds: AUDIT_ROUNDS.map((round) => ({ ...round, decision: byCode.get(round.code) ?? null })),
    });
  }

  if (request.method === 'POST') {
    const engagement = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const input = await body<{ roundCode?: string; status?: RoundStatus; rationale?: string; actor?: string; actorRole?: any }>(request);
    if (!input.roundCode || !isRoundCode(input.roundCode)) return problem('ROUND_CODE_INVALID', 'roundCode must be A01 through A10');
    if (!input.status || !['not_started','in_progress','attention','complete'].includes(input.status)) return problem('ROUND_STATUS_INVALID', 'Invalid round status');
    if (!input.actorRole) return problem('ROUND_ROLE_REQUIRED', 'actorRole is required');
    const decision = validateRoundDecision({ status: input.status, actorRole: input.actorRole, actor: input.actor ?? '', rationale: input.rationale ?? '' });
    if (!decision.allowed) return problem('ROUND_DECISION_BLOCKED', 'Round decision is blocked', 409, decision);
    const previous = await env.DB.prepare('SELECT MAX(version) AS version FROM round_decisions WHERE engagement_id = ? AND round_code = ?').bind(engagementId, input.roundCode).first<Record<string, unknown>>();
    const version = Number(previous?.version ?? 0) + 1;
    const id = phaseAId(); const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO round_decisions (id, engagement_id, round_code, status, rationale, actor, actor_role, version, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, engagementId, input.roundCode, input.status, input.rationale?.trim() ?? '', input.actor!.trim(), input.actorRole, version, at),
      auditEventStatement(env, { engagementId, entityType: 'round_decision', entityId: id, action: 'round.updated', actor: input.actor!.trim(), occurredAt: at, payload: { roundCode: input.roundCode, status: input.status, rationale: input.rationale?.trim() ?? '', version } }),
    ]);
    return respond({ id, roundCode: input.roundCode, status: input.status, version }, 201);
  }

  return null;
}
