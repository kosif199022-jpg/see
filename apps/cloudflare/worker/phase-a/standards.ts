import { findStandard, STANDARDS_LIBRARY } from '../../../../packages/audit-engine/src/standards';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400) => respond({ error: { code, message } }, status);
async function body<T>(request: Request): Promise<T> { return (await request.json()) as T; }

const TARGET_TYPES = new Set(['risk','procedure','workpaper','finding','report_version','trial_balance_line','round_decision']);

export async function handleStandardsRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  if (path === '/api/v1/standards' && request.method === 'GET') {
    return respond({ standards: STANDARDS_LIBRARY, notice: 'Reference cards do not replace authoritative official texts.' });
  }

  const match = path.match(/^\/api\/v1\/engagements\/([^/]+)\/standards-usage$/);
  if (!match) return null;
  const engagementId = match[1];

  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM standard_usages WHERE engagement_id = ? ORDER BY created_at DESC').bind(engagementId).all();
    return respond({ usages: result.results ?? [] });
  }

  if (request.method === 'POST') {
    const engagement = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const input = await body<{ standardCode?: string; targetType?: string; targetId?: string; rationale?: string; actor?: string }>(request);
    const standard = input.standardCode ? findStandard(input.standardCode) : undefined;
    if (!standard) return problem('STANDARD_NOT_FOUND', 'Unknown standards reference', 404);
    if (!input.targetType || !TARGET_TYPES.has(input.targetType) || !input.targetId?.trim() || !input.actor?.trim()) return problem('STANDARD_USAGE_INPUT_REQUIRED', 'targetType, targetId and actor are required');
    const id = phaseAId(); const at = phaseANow();
    const sourceVersion = standard.version ?? standard.effectiveDate ?? standard.sourceNote ?? null;
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO standard_usages (id, engagement_id, standard_code, source_family, source_version, target_type, target_id, rationale, actor, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, engagementId, standard.code, standard.sourceFamily, sourceVersion, input.targetType, input.targetId.trim(), input.rationale?.trim() ?? '', input.actor.trim(), at),
      auditEventStatement(env, { engagementId, entityType: 'standard_usage', entityId: id, action: 'standard.linked', actor: input.actor.trim(), occurredAt: at, payload: { standardCode: standard.code, sourceFamily: standard.sourceFamily, sourceVersion, targetType: input.targetType, targetId: input.targetId.trim() } }),
    ]);
    return respond({ id, standardCode: standard.code, sourceFamily: standard.sourceFamily, sourceVersion }, 201);
  }

  return null;
}
