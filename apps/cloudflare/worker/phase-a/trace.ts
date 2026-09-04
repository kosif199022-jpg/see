import { auditEventStatement, phaseAId, phaseANow } from './events';
import { TRACE_TARGETS, type PhaseAEnv, type TraceTargetType } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400) => respond({ error: { code, message } }, status);
async function jsonBody<T>(request: Request): Promise<T> { return (await request.json()) as T; }

async function targetRecord(env: PhaseAEnv, engagementId: string, type: TraceTargetType, id: string) {
  switch (type) {
    case 'trial_balance_line':
      return env.DB.prepare('SELECT id, account_name AS label, NULL AS status FROM trial_balance_lines WHERE id = ? AND engagement_id = ?').bind(id, engagementId).first<Record<string, unknown>>();
    case 'risk':
      return env.DB.prepare('SELECT id, title AS label, status FROM risks WHERE id = ? AND engagement_id = ?').bind(id, engagementId).first<Record<string, unknown>>();
    case 'procedure':
      return env.DB.prepare('SELECT id, title AS label, status FROM procedures WHERE id = ? AND engagement_id = ?').bind(id, engagementId).first<Record<string, unknown>>();
    case 'procedure_run':
      return env.DB.prepare("SELECT id, 'تشغيل إجراء' AS label, status FROM procedure_runs WHERE id = ? AND engagement_id = ?").bind(id, engagementId).first<Record<string, unknown>>();
    case 'workpaper':
      return env.DB.prepare('SELECT id, title AS label, status FROM workpapers WHERE id = ? AND engagement_id = ?').bind(id, engagementId).first<Record<string, unknown>>();
    case 'finding':
      return env.DB.prepare('SELECT id, title AS label, status FROM findings WHERE id = ? AND engagement_id = ?').bind(id, engagementId).first<Record<string, unknown>>();
    case 'report_version':
      return env.DB.prepare("SELECT id, 'تقرير v' || version AS label, status FROM report_versions WHERE id = ? AND engagement_id = ?").bind(id, engagementId).first<Record<string, unknown>>();
    case 'council_run':
      return env.DB.prepare('SELECT id, task AS label, status FROM council_runs WHERE id = ? AND engagement_id = ?').bind(id, engagementId).first<Record<string, unknown>>();
  }
}

export async function handleTraceRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const traceMatch = path.match(/^\/api\/v1\/engagements\/([^/]+)\/trace$/);
  if (traceMatch && request.method === 'GET') {
    const engagementId = traceMatch[1];
    const [evidenceResult, linksResult] = await Promise.all([
      env.DB.prepare('SELECT id, name, status, sha256 FROM evidence WHERE engagement_id = ? ORDER BY created_at DESC').bind(engagementId).all<Record<string, unknown>>(),
      env.DB.prepare('SELECT * FROM evidence_links WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 250').bind(engagementId).all<Record<string, unknown>>(),
    ]);
    const nodes = new Map<string, Record<string, unknown>>();
    for (const evidence of evidenceResult.results ?? []) {
      nodes.set(`evidence:${evidence.id}`, {
        id: `evidence:${evidence.id}`, recordId: evidence.id, type: 'evidence', label: evidence.name,
        status: evidence.status, sha256: evidence.sha256,
      });
    }
    const edges: Array<Record<string, unknown>> = [];
    for (const link of linksResult.results ?? []) {
      const targetType = String(link.target_type) as TraceTargetType;
      if (!TRACE_TARGETS.includes(targetType)) continue;
      const target = await targetRecord(env, engagementId, targetType, String(link.target_id));
      if (!target) continue;
      const targetKey = `${targetType}:${target.id}`;
      if (!nodes.has(targetKey)) {
        nodes.set(targetKey, { id: targetKey, recordId: target.id, type: targetType, label: target.label, status: target.status ?? undefined });
      }
      edges.push({
        id: String(link.id), from: `evidence:${link.evidence_id}`, to: targetKey, relation: link.relation,
      });
    }
    const linkedEvidence = new Set(edges.map((edge) => String(edge.from).replace(/^evidence:/, '')));
    return respond({
      nodes: [...nodes.values()],
      edges,
      summary: {
        evidenceNodes: (evidenceResult.results ?? []).length,
        linkedTargets: new Set(edges.map((edge) => edge.to)).size,
        unlinkedEvidence: Math.max(0, (evidenceResult.results ?? []).length - linkedEvidence.size),
      },
    });
  }

  const createMatch = path.match(/^\/api\/v1\/engagements\/([^/]+)\/evidence-links$/);
  if (createMatch && request.method === 'POST') {
    const engagementId = createMatch[1];
    const input = await jsonBody<{ evidenceId?: string; targetType?: TraceTargetType; targetId?: string; relation?: string; createdBy?: string }>(request);
    if (!input.evidenceId || !input.targetType || !input.targetId || !input.relation?.trim()) {
      return problem('EVIDENCE_LINK_INPUT_REQUIRED', 'evidenceId, targetType, targetId and relation are required');
    }
    if (!TRACE_TARGETS.includes(input.targetType)) return problem('TRACE_TARGET_INVALID', 'Unsupported evidence link target');
    const evidence = await env.DB.prepare('SELECT id FROM evidence WHERE id = ? AND engagement_id = ?').bind(input.evidenceId, engagementId).first();
    if (!evidence) return problem('EVIDENCE_NOT_FOUND', 'Evidence not found', 404);
    const target = await targetRecord(env, engagementId, input.targetType, input.targetId);
    if (!target) return problem('TRACE_TARGET_NOT_FOUND', 'Trace target not found', 404);
    const existing = await env.DB.prepare(`
      SELECT id FROM evidence_links WHERE evidence_id = ? AND target_type = ? AND target_id = ? AND relation = ?
    `).bind(input.evidenceId, input.targetType, input.targetId, input.relation.trim()).first<{ id: string }>();
    if (existing) return respond({ id: existing.id, duplicate: true });
    const id = phaseAId(); const at = phaseANow(); const actor = input.createdBy?.trim() || 'pilot-user';
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO evidence_links (id, engagement_id, evidence_id, target_type, target_id, relation, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, engagementId, input.evidenceId, input.targetType, input.targetId, input.relation.trim(), actor, at),
      auditEventStatement(env, {
        engagementId, entityType: 'evidence_link', entityId: id, action: 'evidence.linked', actor, occurredAt: at,
        payload: { evidenceId: input.evidenceId, targetType: input.targetType, targetId: input.targetId, relation: input.relation.trim() },
      }),
    ]);
    return respond({ id, duplicate: false }, 201);
  }

  return null;
}
