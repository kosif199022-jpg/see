import {
  validateReviewNoteClear,
  validateRiskClosure,
  validateWorkpaperTransition,
  type AuditActorRole,
  type WorkpaperStatus,
} from '../../../../packages/domain/src/lifecycle';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) =>
  respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
async function jsonBody<T>(request: Request): Promise<T> { return (await request.json()) as T; }

export async function handleFieldworkRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const riskClose = path.match(/^\/api\/v1\/risks\/([^/]+)\/close$/);
  if (riskClose && request.method === 'POST') {
    const risk = await env.DB.prepare('SELECT * FROM risks WHERE id = ?').bind(riskClose[1]).first<Record<string, unknown>>();
    if (!risk) return problem('RISK_NOT_FOUND', 'Risk not found', 404);
    if (risk.status === 'closed') return problem('RISK_ALREADY_CLOSED', 'Risk is already closed', 409);
    const input = await jsonBody<{ actorRole?: AuditActorRole; actor?: string; rationale?: string }>(request);
    if (!input.actorRole) return problem('RISK_CLOSURE_ROLE_REQUIRED', 'actorRole is required');
    const decision = validateRiskClosure({ actorRole: input.actorRole, rationale: input.rationale ?? '' });
    if (!decision.allowed) return problem('RISK_CLOSURE_BLOCKED', 'Risk closure is blocked', 409, decision);
    const actor = input.actor?.trim() || `pilot:${input.actorRole}`;
    const rationale = input.rationale!.trim();
    const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare("UPDATE risks SET status = 'closed' WHERE id = ? AND status != 'closed'").bind(riskClose[1]),
      auditEventStatement(env, {
        engagementId: String(risk.engagement_id), entityType: 'risk', entityId: riskClose[1], action: 'risk.closed', actor, occurredAt: at,
        payload: { previousStatus: risk.status, rationale, score: risk.score, level: risk.level },
      }),
    ]);
    return respond({ id: riskClose[1], status: 'closed' });
  }

  const procedureList = path.match(/^\/api\/v1\/engagements\/([^/]+)\/procedures$/);
  if (procedureList && request.method === 'GET') {
    const result = await env.DB.prepare(`
      SELECT p.*, r.title AS risk_title
      FROM procedures p LEFT JOIN risks r ON r.id = p.risk_id
      WHERE p.engagement_id = ? ORDER BY p.created_at DESC
    `).bind(procedureList[1]).all();
    return respond({ procedures: result.results ?? [] });
  }

  if (procedureList && request.method === 'POST') {
    const engagementId = procedureList[1];
    const input = await jsonBody<{
      title?: string; objective?: string; procedureType?: string; riskId?: string; owner?: string; actor?: string;
    }>(request);
    if (!input.title?.trim() || !input.objective?.trim()) return problem('PROCEDURE_INPUT_REQUIRED', 'title and objective are required');
    const procedureType = ['controls', 'substantive', 'analytics', 'other'].includes(input.procedureType ?? '') ? input.procedureType! : 'other';
    if (input.riskId) {
      const risk = await env.DB.prepare('SELECT id FROM risks WHERE id = ? AND engagement_id = ?').bind(input.riskId, engagementId).first();
      if (!risk) return problem('RISK_NOT_FOUND', 'Risk not found in this engagement', 404);
    }
    const engagement = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const id = phaseAId(); const at = phaseANow(); const actor = input.actor?.trim() || 'pilot-user';
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO procedures (id, engagement_id, risk_id, title, objective, procedure_type, status, owner, version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, 1, ?)
      `).bind(id, engagementId, input.riskId || null, input.title.trim(), input.objective.trim(), procedureType, input.owner?.trim() || null, at),
      auditEventStatement(env, {
        engagementId, entityType: 'procedure', entityId: id, action: 'procedure.created', actor, occurredAt: at,
        payload: { title: input.title.trim(), procedureType, riskId: input.riskId || null },
      }),
    ]);
    return respond({ id, status: 'planned', version: 1 }, 201);
  }

  const procedureRun = path.match(/^\/api\/v1\/procedures\/([^/]+)\/runs$/);
  if (procedureRun && request.method === 'POST') {
    const procedure = await env.DB.prepare('SELECT * FROM procedures WHERE id = ?').bind(procedureRun[1]).first<Record<string, unknown>>();
    if (!procedure) return problem('PROCEDURE_NOT_FOUND', 'Procedure not found', 404);
    const input = await jsonBody<{ result?: string; conclusion?: string; status?: string; actor?: string }>(request);
    const status = input.status === 'completed' ? 'completed' : 'open';
    if (status === 'completed' && !input.conclusion?.trim()) return problem('PROCEDURE_CONCLUSION_REQUIRED', 'Completed procedure requires a conclusion');
    const id = phaseAId(); const at = phaseANow(); const actor = input.actor?.trim() || 'pilot-user';
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO procedure_runs (id, procedure_id, engagement_id, result, conclusion, status, performed_by, performed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, procedureRun[1], String(procedure.engagement_id), input.result?.trim() ?? '', input.conclusion?.trim() ?? '', status, actor, status === 'completed' ? at : null, at),
      auditEventStatement(env, {
        engagementId: String(procedure.engagement_id), entityType: 'procedure_run', entityId: id,
        action: status === 'completed' ? 'procedure.completed' : 'procedure.started', actor, occurredAt: at,
        payload: { procedureId: procedureRun[1], status },
      }),
    ]);
    return respond({ id, status }, 201);
  }

  const workpaperList = path.match(/^\/api\/v1\/engagements\/([^/]+)\/workpapers$/);
  if (workpaperList && request.method === 'GET') {
    const result = await env.DB.prepare(`
      SELECT w.*, v.content, v.conclusion, v.preparer, v.reviewer, v.status AS version_status
      FROM workpapers w
      LEFT JOIN workpaper_versions v ON v.workpaper_id = w.id AND v.version = w.current_version
      WHERE w.engagement_id = ? ORDER BY w.created_at DESC
    `).bind(workpaperList[1]).all();
    return respond({ workpapers: result.results ?? [] });
  }

  if (workpaperList && request.method === 'POST') {
    const engagementId = workpaperList[1];
    const input = await jsonBody<{ title?: string; procedureId?: string; content?: string; conclusion?: string; preparer?: string }>(request);
    if (!input.title?.trim() || !input.preparer?.trim()) return problem('WORKPAPER_INPUT_REQUIRED', 'title and preparer are required');
    if (input.procedureId) {
      const procedure = await env.DB.prepare('SELECT id FROM procedures WHERE id = ? AND engagement_id = ?').bind(input.procedureId, engagementId).first();
      if (!procedure) return problem('PROCEDURE_NOT_FOUND', 'Procedure not found in this engagement', 404);
    }
    const engagement = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const id = phaseAId(); const versionId = phaseAId(); const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO workpapers (id, engagement_id, procedure_id, title, status, current_version, created_at) VALUES (?, ?, ?, ?, 'draft', 1, ?)`)
        .bind(id, engagementId, input.procedureId || null, input.title.trim(), at),
      env.DB.prepare(`
        INSERT INTO workpaper_versions (id, workpaper_id, version, content, conclusion, preparer, status, created_at)
        VALUES (?, ?, 1, ?, ?, ?, 'draft', ?)
      `).bind(versionId, id, input.content?.trim() ?? '', input.conclusion?.trim() ?? '', input.preparer.trim(), at),
      auditEventStatement(env, {
        engagementId, entityType: 'workpaper', entityId: id, action: 'workpaper.created', actor: input.preparer.trim(), occurredAt: at,
        payload: { version: 1, procedureId: input.procedureId || null },
      }),
    ]);
    return respond({ id, version: 1, status: 'draft' }, 201);
  }

  const workpaperVersion = path.match(/^\/api\/v1\/workpapers\/([^/]+)\/versions$/);
  if (workpaperVersion && request.method === 'POST') {
    const workpaper = await env.DB.prepare('SELECT * FROM workpapers WHERE id = ?').bind(workpaperVersion[1]).first<Record<string, unknown>>();
    if (!workpaper) return problem('WORKPAPER_NOT_FOUND', 'Workpaper not found', 404);
    const input = await jsonBody<{ content?: string; conclusion?: string; preparer?: string }>(request);
    if (!input.preparer?.trim()) return problem('WORKPAPER_PREPARER_REQUIRED', 'preparer is required');
    const version = Number(workpaper.current_version ?? 1) + 1;
    const versionId = phaseAId(); const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare('UPDATE workpapers SET current_version = ?, status = ? WHERE id = ?').bind(version, 'draft', workpaperVersion[1]),
      env.DB.prepare(`
        INSERT INTO workpaper_versions (id, workpaper_id, version, content, conclusion, preparer, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
      `).bind(versionId, workpaperVersion[1], version, input.content?.trim() ?? '', input.conclusion?.trim() ?? '', input.preparer.trim(), at),
      auditEventStatement(env, {
        engagementId: String(workpaper.engagement_id), entityType: 'workpaper', entityId: workpaperVersion[1],
        action: 'workpaper.version_created', actor: input.preparer.trim(), occurredAt: at, payload: { version },
      }),
    ]);
    return respond({ id: workpaperVersion[1], version, status: 'draft' }, 201);
  }

  const workpaperTransition = path.match(/^\/api\/v1\/workpapers\/([^/]+)\/transitions$/);
  if (workpaperTransition && request.method === 'POST') {
    const workpaper = await env.DB.prepare('SELECT * FROM workpapers WHERE id = ?').bind(workpaperTransition[1]).first<Record<string, unknown>>();
    if (!workpaper) return problem('WORKPAPER_NOT_FOUND', 'Workpaper not found', 404);
    const input = await jsonBody<{ to?: WorkpaperStatus; actorRole?: AuditActorRole; actor?: string }>(request);
    if (!input.to || !input.actorRole) return problem('WORKPAPER_TRANSITION_REQUIRED', 'to and actorRole are required');
    const from = String(workpaper.status) as WorkpaperStatus;
    const decision = validateWorkpaperTransition(from, input.to, { actorRole: input.actorRole });
    if (!decision.allowed) return problem('WORKPAPER_TRANSITION_BLOCKED', 'Workpaper transition is blocked', 409, decision);
    const actor = input.actor?.trim() || `pilot:${input.actorRole}`; const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare('UPDATE workpapers SET status = ? WHERE id = ? AND status = ?').bind(input.to, workpaperTransition[1], from),
      env.DB.prepare('UPDATE workpaper_versions SET status = ?, reviewer = COALESCE(reviewer, ?) WHERE workpaper_id = ? AND version = ?')
        .bind(input.to, actor, workpaperTransition[1], Number(workpaper.current_version)),
      auditEventStatement(env, {
        engagementId: String(workpaper.engagement_id), entityType: 'workpaper', entityId: workpaperTransition[1],
        action: 'workpaper.transitioned', actor, occurredAt: at, payload: { from, to: input.to, version: workpaper.current_version },
      }),
    ]);
    return respond({ id: workpaperTransition[1], from, to: input.to });
  }

  const engagementReviewNotes = path.match(/^\/api\/v1\/engagements\/([^/]+)\/review-notes$/);
  if (engagementReviewNotes && request.method === 'GET') {
    const result = await env.DB.prepare(`
      SELECT rn.*, w.title AS workpaper_title
      FROM review_notes rn
      LEFT JOIN workpapers w ON w.id = rn.workpaper_id
      WHERE rn.engagement_id = ?
      ORDER BY CASE rn.status WHEN 'open' THEN 0 ELSE 1 END, rn.created_at DESC
    `).bind(engagementReviewNotes[1]).all();
    return respond({ notes: result.results ?? [] });
  }

  const reviewNote = path.match(/^\/api\/v1\/workpapers\/([^/]+)\/review-notes$/);
  if (reviewNote && request.method === 'POST') {
    const workpaper = await env.DB.prepare('SELECT * FROM workpapers WHERE id = ?').bind(reviewNote[1]).first<Record<string, unknown>>();
    if (!workpaper) return problem('WORKPAPER_NOT_FOUND', 'Workpaper not found', 404);
    const input = await jsonBody<{ note?: string; createdBy?: string }>(request);
    if (!input.note?.trim() || !input.createdBy?.trim()) return problem('REVIEW_NOTE_INPUT_REQUIRED', 'note and createdBy are required');
    const id = phaseAId(); const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO review_notes (id, engagement_id, workpaper_id, note, status, created_by, created_at) VALUES (?, ?, ?, ?, 'open', ?, ?)`)
        .bind(id, String(workpaper.engagement_id), reviewNote[1], input.note.trim(), input.createdBy.trim(), at),
      auditEventStatement(env, {
        engagementId: String(workpaper.engagement_id), entityType: 'review_note', entityId: id,
        action: 'review_note.opened', actor: input.createdBy.trim(), occurredAt: at, payload: { workpaperId: reviewNote[1] },
      }),
    ]);
    return respond({ id, status: 'open' }, 201);
  }

  const clearNote = path.match(/^\/api\/v1\/review-notes\/([^/]+)\/clear$/);
  if (clearNote && request.method === 'POST') {
    const note = await env.DB.prepare('SELECT * FROM review_notes WHERE id = ?').bind(clearNote[1]).first<Record<string, unknown>>();
    if (!note) return problem('REVIEW_NOTE_NOT_FOUND', 'Review note not found', 404);
    if (note.status === 'cleared') return problem('REVIEW_NOTE_ALREADY_CLEARED', 'Review note is already cleared', 409);
    const input = await jsonBody<{ actor?: string; actorRole?: AuditActorRole }>(request);
    const decision = validateReviewNoteClear({ actorRole: input.actorRole ?? 'senior', actor: input.actor ?? '' });
    if (!decision.allowed) return problem('REVIEW_NOTE_CLEAR_BLOCKED', 'Review note clearance is blocked', 409, decision);
    const actor = input.actor!.trim();
    const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare("UPDATE review_notes SET status = 'cleared', cleared_by = ?, cleared_at = ? WHERE id = ? AND status = 'open'")
        .bind(actor, at, clearNote[1]),
      auditEventStatement(env, {
        engagementId: String(note.engagement_id), entityType: 'review_note', entityId: clearNote[1], action: 'review_note.cleared',
        actor, occurredAt: at, payload: { workpaperId: note.workpaper_id },
      }),
    ]);
    return respond({ id: clearNote[1], status: 'cleared' });
  }

  return null;
}
