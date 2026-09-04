import {
  calculateMateriality,
  scoreRisk,
  summarizeAudit,
  validateTrialBalance,
} from '../../../packages/audit-engine/src/cloudflare-core';
import { buildPhaseADemoSeed } from './phase-a/demo-seed';

interface Env {
  DB: D1Database;
  EVIDENCE: R2Bucket;
  ALLOW_PUBLIC_DEMO?: string;
  APP_ACCESS_TOKEN?: string;
}

type Json = Record<string, unknown>;
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function response(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function error(message: string, status = 400) { return response({ error: message }, status); }
function authRequired(request: Request, env: Env) {
  if (!env.APP_ACCESS_TOKEN) return false;
  return request.headers.get('Authorization') !== `Bearer ${env.APP_ACCESS_TOKEN}`;
}
async function body<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('Expected application/json');
  return (await request.json()) as T;
}
function safeMinor(value: unknown, field: string): number {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (typeof numeric !== 'number' || !Number.isSafeInteger(numeric) || numeric < 0) {
    throw new Error(`${field} must be a non-negative safe integer in minor units`);
  }
  return numeric;
}
async function event(env: Env, engagementId: string | null, entityType: string, entityId: string, action: string, payload: Json = {}) {
  await env.DB.prepare(`INSERT INTO audit_events (id, engagement_id, entity_type, entity_id, action, payload_json, actor, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id(), engagementId, entityType, entityId, action, JSON.stringify(payload), 'pilot-user', now()).run();
}
async function getEngagement(env: Env, engagementId: string) {
  return env.DB.prepare('SELECT * FROM engagements WHERE id = ?').bind(engagementId).first<Record<string, unknown>>();
}

async function dashboard(env: Env, engagementId: string) {
  const engagement = await getEngagement(env, engagementId);
  if (!engagement) return null;
  const [tb, mappings, materiality, risks, evidence, findings, events] = await Promise.all([
    env.DB.prepare('SELECT * FROM trial_balance_lines WHERE engagement_id = ? ORDER BY source_row').bind(engagementId).all(),
    env.DB.prepare(`SELECT m.*, t.account_code, t.account_name FROM account_mappings m JOIN trial_balance_lines t ON t.id = m.tb_line_id WHERE m.engagement_id = ? ORDER BY m.created_at DESC`).bind(engagementId).all(),
    env.DB.prepare('SELECT * FROM materiality_assessments WHERE engagement_id = ? ORDER BY created_at DESC').bind(engagementId).all(),
    env.DB.prepare('SELECT * FROM risks WHERE engagement_id = ? ORDER BY score DESC, created_at DESC').bind(engagementId).all(),
    env.DB.prepare('SELECT * FROM evidence WHERE engagement_id = ? ORDER BY created_at DESC').bind(engagementId).all(),
    env.DB.prepare('SELECT * FROM findings WHERE engagement_id = ? ORDER BY created_at DESC').bind(engagementId).all(),
    env.DB.prepare('SELECT * FROM audit_events WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 30').bind(engagementId).all(),
  ]);
  const tbLines = (tb.results ?? []) as Array<Record<string, unknown>>;
  const validation = validateTrialBalance(tbLines.map((line) => ({
    account: String(line.account_name ?? ''), debit: BigInt(Number(line.debit_minor ?? 0)), credit: BigInt(Number(line.credit_minor ?? 0)),
  })));
  const mappingRows = (mappings.results ?? []) as Array<Record<string, unknown>>;
  const latestMappingByLine = new Map<string, Record<string, unknown>>();
  for (const mapping of mappingRows) {
    const lineId = String(mapping.tb_line_id);
    if (!latestMappingByLine.has(lineId)) latestMappingByLine.set(lineId, mapping);
  }
  const unapprovedMappings = tbLines.filter((line) => latestMappingByLine.get(String(line.id))?.status !== 'approved').length;
  const riskRows = (risks.results ?? []) as Array<Record<string, unknown>>;
  const findingRows = (findings.results ?? []) as Array<Record<string, unknown>>;
  const evidenceRows = (evidence.results ?? []) as Array<Record<string, unknown>>;
  const summary = summarizeAudit({
    engagementName: String(engagement.name),
    unapprovedMappings,
    openHighRisks: riskRows.filter((risk) => risk.level === 'high' && risk.status !== 'closed').length,
    unresolvedFindings: findingRows.filter((finding) => finding.status !== 'resolved').length,
    evidenceCount: evidenceRows.length,
  });
  return {
    engagement,
    trialBalance: { lines: tbLines, validation: { ...validation, totalDebit: validation.totalDebit.toString(), totalCredit: validation.totalCredit.toString() } },
    mappings: mappingRows, materiality: materiality.results ?? [], risks: riskRows, evidence: evidenceRows, findings: findingRows, events: events.results ?? [], summary,
  };
}

async function createDemo(env: Env) {
  const engagementId = id();
  const createdAt = now();
  await env.DB.prepare('INSERT INTO engagements (id, name, client_name, period_end, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(engagementId, `SEE Demo ${createdAt.slice(0, 10)}`, 'شركة نموذجية', '2026-12-31', 'planning', createdAt).run();
  const lines = [
    ['1000', 'النقد والبنوك', 25000000, 0], ['1100', 'الذمم المدينة', 18000000, 0], ['2000', 'الموردون', 0, 13000000],
    ['3000', 'رأس المال', 0, 10000000], ['4000', 'الإيرادات', 0, 50000000], ['5000', 'تكلفة ومصروفات', 30000000, 0],
  ] as const;
  const statements: D1PreparedStatement[] = [];
  const lineIds: string[] = [];
  lines.forEach(([code, name, debit, credit], index) => {
    const lineId = id(); lineIds.push(lineId);
    statements.push(env.DB.prepare(`INSERT INTO trial_balance_lines (id, engagement_id, account_code, account_name, debit_minor, credit_minor, source_row, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(lineId, engagementId, code, name, debit, credit, index + 1, createdAt));
  });
  await env.DB.batch(statements);
  const demoMappings = [[lineIds[0], 'Cash and cash equivalents'], [lineIds[1], 'Trade receivables'], [lineIds[2], 'Trade payables'], [lineIds[3], 'Equity'], [lineIds[4], 'Revenue']] as const;
  for (const [tbLineId, statementLine] of demoMappings) {
    const mappingId = id();
    await env.DB.prepare(`INSERT INTO account_mappings (id, engagement_id, tb_line_id, statement_line, confidence, rationale, status, version, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 'approved', 1, ?, ?)`)
      .bind(mappingId, engagementId, tbLineId, statementLine, 95, 'Demo deterministic mapping', createdAt, createdAt).run();
  }
  const materiality = calculateMateriality({ benchmark: 50_000_000n, percentageBasisPoints: 500 });
  await env.DB.prepare(`INSERT INTO materiality_assessments (id, engagement_id, benchmark_minor, basis_points, amount_minor, rationale, status, version, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`)
    .bind(id(), engagementId, 50_000_000, 500, Number(materiality.amount), '5% of revenue for pilot demonstration', materiality.version, createdAt, createdAt).run();
  const risk = scoreRisk({ likelihood: 4, magnitude: 5, controlReliance: 2, rationale: 'Revenue recognition has elevated inherent risk.' });
  const riskId = id();
  await env.DB.prepare(`INSERT INTO risks (id, engagement_id, title, likelihood, magnitude, control_reliance, score, level, rationale, status, version, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`)
    .bind(riskId, engagementId, 'Revenue recognition', 4, 5, 2, risk.score, risk.level, risk.rationale, risk.version, createdAt, createdAt).run();
  const evidenceId = id();
  const evidenceText = new TextEncoder().encode('Demo evidence only. Replace with client-supported evidence in a secured deployment.');
  const hash = await crypto.subtle.digest('SHA-256', evidenceText);
  const sha256 = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const objectKey = `${engagementId}/${evidenceId}/demo-evidence.txt`;
  await env.EVIDENCE.put(objectKey, evidenceText, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } });
  await env.DB.prepare(`INSERT INTO evidence (id, engagement_id, name, object_key, sha256, size, mime, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'registered', ?)`)
    .bind(evidenceId, engagementId, 'demo-evidence.txt', objectKey, sha256, evidenceText.byteLength, 'text/plain', createdAt).run();
  await env.DB.prepare(`INSERT INTO findings (id, engagement_id, title, severity, description, status, evidence_id, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`)
    .bind(id(), engagementId, 'Revenue cut-off requires completion', 'medium', 'Complete period-end cut-off testing before closure.', evidenceId, createdAt).run();

  const phaseA = buildPhaseADemoSeed({
    engagementId,
    riskId,
    evidenceId,
    createdAt,
    evidenceName: 'demo-evidence.txt',
    evidenceSha256: sha256,
    evidenceStatus: 'registered',
  });
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO pbc_requests (id, engagement_id, title, description, priority, status, due_at, evidence_id, revision, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.pbc.id, phaseA.pbc.engagementId, phaseA.pbc.title, phaseA.pbc.description, phaseA.pbc.priority, phaseA.pbc.status, phaseA.pbc.dueAt, phaseA.pbc.evidenceId, phaseA.pbc.revision, phaseA.pbc.createdBy, phaseA.pbc.createdAt, phaseA.pbc.updatedAt),
    env.DB.prepare(`INSERT INTO procedures (id, engagement_id, risk_id, title, objective, procedure_type, status, owner, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.procedure.id, phaseA.procedure.engagementId, phaseA.procedure.riskId, phaseA.procedure.title, phaseA.procedure.objective, phaseA.procedure.procedureType, phaseA.procedure.status, phaseA.procedure.owner, phaseA.procedure.version, phaseA.procedure.createdAt),
    env.DB.prepare(`INSERT INTO procedure_runs (id, procedure_id, engagement_id, result, conclusion, status, performed_by, performed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.procedureRun.id, phaseA.procedureRun.procedureId, phaseA.procedureRun.engagementId, phaseA.procedureRun.result, phaseA.procedureRun.conclusion, phaseA.procedureRun.status, phaseA.procedureRun.performedBy, phaseA.procedureRun.performedAt, phaseA.procedureRun.createdAt),
    env.DB.prepare(`INSERT INTO workpapers (id, engagement_id, procedure_id, title, status, current_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.workpaper.id, phaseA.workpaper.engagementId, phaseA.workpaper.procedureId, phaseA.workpaper.title, phaseA.workpaper.status, phaseA.workpaper.currentVersion, phaseA.workpaper.createdAt),
    env.DB.prepare(`INSERT INTO workpaper_versions (id, workpaper_id, version, content, conclusion, preparer, reviewer, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.workpaperVersion.id, phaseA.workpaperVersion.workpaperId, phaseA.workpaperVersion.version, phaseA.workpaperVersion.content, phaseA.workpaperVersion.conclusion, phaseA.workpaperVersion.preparer, phaseA.workpaperVersion.reviewer, phaseA.workpaperVersion.status, phaseA.workpaperVersion.createdAt),
    env.DB.prepare(`INSERT INTO review_notes (id, engagement_id, workpaper_id, note, status, created_by, cleared_by, created_at, cleared_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.reviewNote.id, phaseA.reviewNote.engagementId, phaseA.reviewNote.workpaperId, phaseA.reviewNote.note, phaseA.reviewNote.status, phaseA.reviewNote.createdBy, phaseA.reviewNote.clearedBy, phaseA.reviewNote.createdAt, phaseA.reviewNote.clearedAt),
    env.DB.prepare(`INSERT INTO evidence_links (id, engagement_id, evidence_id, target_type, target_id, relation, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.evidenceLink.id, phaseA.evidenceLink.engagementId, phaseA.evidenceLink.evidenceId, phaseA.evidenceLink.targetType, phaseA.evidenceLink.targetId, phaseA.evidenceLink.relation, phaseA.evidenceLink.createdBy, phaseA.evidenceLink.createdAt),
    env.DB.prepare(`INSERT INTO council_runs (id, engagement_id, status, task, evidence_snapshot_json, synthesis_json, human_decision, human_rationale, created_by, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(phaseA.councilRun.id, phaseA.councilRun.engagementId, phaseA.councilRun.status, phaseA.councilRun.task, phaseA.councilRun.evidenceSnapshotJson, phaseA.councilRun.synthesisJson, phaseA.councilRun.humanDecision, phaseA.councilRun.humanRationale, phaseA.councilRun.createdBy, phaseA.councilRun.createdAt, phaseA.councilRun.reviewedAt),
  ]);
  await event(env, engagementId, 'engagement', engagementId, 'demo_created', { source: 'SEE Cloudflare MVP', phaseA: true });
  await event(env, engagementId, 'engagement', engagementId, 'phase_a_demo_seeded', {
    pbcId: phaseA.pbc.id,
    procedureId: phaseA.procedure.id,
    workpaperId: phaseA.workpaper.id,
    councilRunId: phaseA.councilRun.id,
    approvedReportSeeded: false,
  });
  return engagementId;
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url); const path = url.pathname;
  if (path === '/api/health' && request.method === 'GET') return response({ status: 'ok', version: '0.2.0', publicDemo: env.ALLOW_PUBLIC_DEMO === 'true', authConfigured: Boolean(env.APP_ACCESS_TOKEN) });
  if (authRequired(request, env)) return error('Unauthorized', 401);
  if (path === '/api/engagements' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM engagements ORDER BY created_at DESC').all(); return response({ engagements: result.results ?? [] });
  }
  if (path === '/api/engagements' && request.method === 'POST') {
    const input = await body<{ name?: string; clientName?: string; periodEnd?: string }>(request);
    if (!input.name?.trim() || !input.clientName?.trim() || !input.periodEnd?.trim()) return error('name, clientName and periodEnd are required');
    const engagementId = id();
    await env.DB.prepare('INSERT INTO engagements (id, name, client_name, period_end, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(engagementId, input.name.trim(), input.clientName.trim(), input.periodEnd.trim(), 'planning', now()).run();
    await event(env, engagementId, 'engagement', engagementId, 'created', { name: input.name.trim() }); return response({ id: engagementId }, 201);
  }
  if (path === '/api/demo' && request.method === 'POST') {
    if (env.ALLOW_PUBLIC_DEMO !== 'true') return error('Public demo creation is disabled', 403);
    return response({ id: await createDemo(env) }, 201);
  }
  const dashboardMatch = path.match(/^\/api\/engagements\/([^/]+)\/dashboard$/);
  if (dashboardMatch && request.method === 'GET') { const data = await dashboard(env, dashboardMatch[1]); return data ? response(data) : error('Engagement not found', 404); }
  const tbMatch = path.match(/^\/api\/engagements\/([^/]+)\/trial-balance$/);
  if (tbMatch && request.method === 'POST') {
    const engagementId = tbMatch[1]; if (!(await getEngagement(env, engagementId))) return error('Engagement not found', 404);
    const existing = await env.DB.prepare('SELECT COUNT(*) AS count FROM trial_balance_lines WHERE engagement_id = ?').bind(engagementId).first<{ count: number }>();
    if ((existing?.count ?? 0) > 0) return error('Trial balance already exists for this pilot engagement; create a new engagement to preserve history.', 409);
    const input = await body<{ lines?: Array<{ accountCode?: string; accountName?: string; debitMinor?: number | string; creditMinor?: number | string }> }>(request);
    if (!input.lines?.length) return error('At least one trial balance line is required');
    const canonical = input.lines.map((line, index) => ({ accountCode: line.accountCode?.trim() || String(index + 1), accountName: line.accountName?.trim() || '', debitMinor: safeMinor(line.debitMinor ?? 0, 'debitMinor'), creditMinor: safeMinor(line.creditMinor ?? 0, 'creditMinor') }));
    const validation = validateTrialBalance(canonical.map((line) => ({ account: line.accountName, debit: BigInt(line.debitMinor), credit: BigInt(line.creditMinor) })));
    if (!validation.balanced) return error(validation.errors.join('; '), 422);
    const createdAt = now();
    await env.DB.batch(canonical.map((line, index) => env.DB.prepare(`INSERT INTO trial_balance_lines (id, engagement_id, account_code, account_name, debit_minor, credit_minor, source_row, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id(), engagementId, line.accountCode, line.accountName, line.debitMinor, line.creditMinor, index + 1, createdAt)));
    await event(env, engagementId, 'trial_balance', engagementId, 'imported', { lineCount: canonical.length, totalDebit: validation.totalDebit.toString() }); return response({ balanced: true, lineCount: canonical.length }, 201);
  }
  const mappingMatch = path.match(/^\/api\/engagements\/([^/]+)\/mappings$/);
  if (mappingMatch && request.method === 'POST') {
    const engagementId = mappingMatch[1]; const input = await body<{ tbLineId?: string; statementLine?: string; confidence?: number; rationale?: string }>(request);
    if (!input.tbLineId || !input.statementLine?.trim()) return error('tbLineId and statementLine are required');
    const tbLine = await env.DB.prepare('SELECT id FROM trial_balance_lines WHERE id = ? AND engagement_id = ?').bind(input.tbLineId, engagementId).first(); if (!tbLine) return error('Trial balance line not found', 404);
    const previous = await env.DB.prepare('SELECT MAX(version) AS version FROM account_mappings WHERE tb_line_id = ?').bind(input.tbLineId).first<{ version: number | null }>();
    const mappingId = id();
    await env.DB.prepare(`INSERT INTO account_mappings (id, engagement_id, tb_line_id, statement_line, confidence, rationale, status, version, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
      .bind(mappingId, engagementId, input.tbLineId, input.statementLine.trim(), Math.max(0, Math.min(100, Math.round(input.confidence ?? 0))), input.rationale?.trim() ?? '', (previous?.version ?? 0) + 1, now()).run();
    await event(env, engagementId, 'mapping', mappingId, 'proposed', { statementLine: input.statementLine.trim() }); return response({ id: mappingId }, 201);
  }
  const approveMapping = path.match(/^\/api\/mappings\/([^/]+)\/approve$/);
  if (approveMapping && request.method === 'POST') {
    const mapping = await env.DB.prepare('SELECT * FROM account_mappings WHERE id = ?').bind(approveMapping[1]).first<Record<string, unknown>>(); if (!mapping) return error('Mapping not found', 404);
    if (mapping.status === 'approved') return error('Mapping is already approved and immutable', 409);
    await env.DB.prepare("UPDATE account_mappings SET status = 'approved', approved_at = ? WHERE id = ? AND status = 'pending'").bind(now(), approveMapping[1]).run();
    await event(env, String(mapping.engagement_id), 'mapping', approveMapping[1], 'approved', { version: mapping.version }); return response({ approved: true });
  }
  const materialityMatch = path.match(/^\/api\/engagements\/([^/]+)\/materiality$/);
  if (materialityMatch && request.method === 'POST') {
    const engagementId = materialityMatch[1]; const input = await body<{ benchmarkMinor?: number | string; basisPoints?: number; rationale?: string }>(request);
    const benchmarkMinor = safeMinor(input.benchmarkMinor ?? 0, 'benchmarkMinor'); if (!input.rationale?.trim()) return error('Materiality rationale is required');
    const result = calculateMateriality({ benchmark: BigInt(benchmarkMinor), percentageBasisPoints: Math.round(input.basisPoints ?? 0) }); const materialityId = id();
    await env.DB.prepare(`INSERT INTO materiality_assessments (id, engagement_id, benchmark_minor, basis_points, amount_minor, rationale, status, version, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
      .bind(materialityId, engagementId, benchmarkMinor, Math.round(input.basisPoints ?? 0), Number(result.amount), input.rationale.trim(), result.version, now()).run();
    await event(env, engagementId, 'materiality', materialityId, 'calculated', { amountMinor: result.amount.toString(), version: result.version }); return response({ id: materialityId, amountMinor: result.amount.toString(), version: result.version }, 201);
  }
  const approveMateriality = path.match(/^\/api\/materiality\/([^/]+)\/approve$/);
  if (approveMateriality && request.method === 'POST') {
    const row = await env.DB.prepare('SELECT * FROM materiality_assessments WHERE id = ?').bind(approveMateriality[1]).first<Record<string, unknown>>(); if (!row) return error('Materiality assessment not found', 404);
    if (row.status === 'approved') return error('Materiality assessment is already approved and immutable', 409);
    await env.DB.prepare("UPDATE materiality_assessments SET status = 'approved', approved_at = ? WHERE id = ? AND status = 'pending'").bind(now(), approveMateriality[1]).run();
    await event(env, String(row.engagement_id), 'materiality', approveMateriality[1], 'approved', { version: row.version }); return response({ approved: true });
  }
  const riskMatch = path.match(/^\/api\/engagements\/([^/]+)\/risks$/);
  if (riskMatch && request.method === 'POST') {
    const engagementId = riskMatch[1]; const input = await body<{ title?: string; likelihood?: number; magnitude?: number; controlReliance?: number; rationale?: string }>(request); if (!input.title?.trim()) return error('Risk title is required');
    const risk = scoreRisk({ likelihood: input.likelihood ?? 0, magnitude: input.magnitude ?? 0, controlReliance: input.controlReliance ?? 0, rationale: input.rationale ?? '' }); const riskId = id();
    await env.DB.prepare(`INSERT INTO risks (id, engagement_id, title, likelihood, magnitude, control_reliance, score, level, rationale, status, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`)
      .bind(riskId, engagementId, input.title.trim(), input.likelihood, input.magnitude, input.controlReliance, risk.score, risk.level, risk.rationale, risk.version, now()).run();
    await event(env, engagementId, 'risk', riskId, 'assessed', { score: risk.score, level: risk.level, version: risk.version }); return response({ id: riskId, ...risk }, 201);
  }
  const approveRisk = path.match(/^\/api\/risks\/([^/]+)\/approve$/);
  if (approveRisk && request.method === 'POST') {
    const row = await env.DB.prepare('SELECT * FROM risks WHERE id = ?').bind(approveRisk[1]).first<Record<string, unknown>>(); if (!row) return error('Risk not found', 404);
    await env.DB.prepare('UPDATE risks SET approved_at = ? WHERE id = ? AND approved_at IS NULL').bind(now(), approveRisk[1]).run();
    await event(env, String(row.engagement_id), 'risk', approveRisk[1], 'approved', { score: row.score, version: row.version }); return response({ approved: true });
  }
  const evidenceMatch = path.match(/^\/api\/engagements\/([^/]+)\/evidence$/);
  if (evidenceMatch && request.method === 'POST') {
    const engagementId = evidenceMatch[1]; const form = await request.formData(); const upload = form.get('file');
    if (!(upload instanceof File) || upload.size === 0) return error('A non-empty evidence file is required'); if (upload.size > 10 * 1024 * 1024) return error('Evidence file exceeds the 10 MB pilot limit', 413);
    const bytes = await upload.arrayBuffer(); const hash = await crypto.subtle.digest('SHA-256', bytes); const sha256 = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const evidenceId = id(); const objectKey = `${engagementId}/${evidenceId}/${upload.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'evidence.bin'}`;
    await env.EVIDENCE.put(objectKey, bytes, { httpMetadata: { contentType: upload.type || 'application/octet-stream' } });
    await env.DB.prepare(`INSERT INTO evidence (id, engagement_id, name, object_key, sha256, size, mime, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'registered', ?)`)
      .bind(evidenceId, engagementId, upload.name, objectKey, sha256, upload.size, upload.type || 'application/octet-stream', now()).run();
    await event(env, engagementId, 'evidence', evidenceId, 'registered', { name: upload.name, sha256, size: upload.size }); return response({ id: evidenceId, sha256 }, 201);
  }
  const evidenceDownload = path.match(/^\/api\/evidence\/([^/]+)\/download$/);
  if (evidenceDownload && request.method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM evidence WHERE id = ?').bind(evidenceDownload[1]).first<Record<string, unknown>>(); if (!row) return error('Evidence not found', 404);
    const object = await env.EVIDENCE.get(String(row.object_key)); if (!object) return error('Evidence object is missing', 404);
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set('etag', object.httpEtag); headers.set('Content-Disposition', `attachment; filename="${String(row.name).replace(/"/g, '')}"`); return new Response(object.body, { headers });
  }
  const findingMatch = path.match(/^\/api\/engagements\/([^/]+)\/findings$/);
  if (findingMatch && request.method === 'POST') {
    const engagementId = findingMatch[1]; const input = await body<{ title?: string; severity?: string; description?: string; evidenceId?: string }>(request); if (!input.title?.trim() || !input.description?.trim()) return error('Finding title and description are required');
    const severity = ['low', 'medium', 'high', 'critical'].includes(input.severity ?? '') ? input.severity! : 'medium'; const findingId = id();
    await env.DB.prepare(`INSERT INTO findings (id, engagement_id, title, severity, description, status, evidence_id, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`)
      .bind(findingId, engagementId, input.title.trim(), severity, input.description.trim(), input.evidenceId || null, now()).run();
    await event(env, engagementId, 'finding', findingId, 'created', { severity }); return response({ id: findingId }, 201);
  }
  const resolveFinding = path.match(/^\/api\/findings\/([^/]+)\/resolve$/);
  if (resolveFinding && request.method === 'POST') {
    const row = await env.DB.prepare('SELECT * FROM findings WHERE id = ?').bind(resolveFinding[1]).first<Record<string, unknown>>(); if (!row) return error('Finding not found', 404);
    await env.DB.prepare("UPDATE findings SET status = 'resolved' WHERE id = ? AND status != 'resolved'").bind(resolveFinding[1]).run(); await event(env, String(row.engagement_id), 'finding', resolveFinding[1], 'resolved'); return response({ resolved: true });
  }
  return error('API route not found', 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try { return await handleApi(request, env); }
    catch (cause) { console.error(cause); return error(cause instanceof Error ? cause.message : 'Unexpected server error', 500); }
  },
} satisfies ExportedHandler<Env>;
