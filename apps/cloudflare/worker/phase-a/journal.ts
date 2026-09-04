import { analyzeJournalEntry, JOURNAL_ENGINE_VERSION } from '../../../../packages/audit-engine/src/journal-signals';
import { parseMoneyMinor } from '../../../../packages/audit-engine/src/money';
import { selectSample } from '../../../../packages/audit-engine/src/sampling';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) => respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
async function body<T>(request: Request): Promise<T> { return (await request.json()) as T; }

function safeMinor(value: unknown): number {
  const minor = parseMoneyMinor(value);
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (minor > max || minor < -max) throw new RangeError('minor-unit value exceeds safe D1 integer range');
  return Number(minor);
}

export async function handleJournalRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const journal = path.match(/^\/api\/v1\/engagements\/([^/]+)\/journal-review$/);
  if (journal && request.method === 'GET') {
    const run = await env.DB.prepare('SELECT * FROM journal_review_runs WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 1').bind(journal[1]).first<Record<string, unknown>>();
    if (!run) return respond({ run: null, items: [] });
    const items = await env.DB.prepare(`
      SELECT i.*, e.entry_number, e.line_number, e.entry_date, e.account_code, e.account_name,
             e.debit_minor, e.credit_minor, e.description, e.user_name, e.is_manual,
             d.disposition, d.rationale AS decision_rationale, d.reviewed_by, d.reviewed_at
      FROM journal_review_items i
      JOIN journal_entries e ON e.id = i.journal_entry_id
      LEFT JOIN journal_review_decisions d ON d.review_item_id = i.id
      WHERE i.run_id = ? ORDER BY e.entry_date DESC, e.entry_number, e.line_number, i.signal_code
    `).bind(String(run.id)).all();
    return respond({ run, items: items.results ?? [] });
  }

  if (journal && request.method === 'POST') {
    const engagementId = journal[1];
    const engagement = await env.DB.prepare('SELECT id, period_end FROM engagements WHERE id = ?').bind(engagementId).first<Record<string, unknown>>();
    if (!engagement) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const input = await body<{
      sourceVersion?: string;
      actor?: string;
      periodEnd?: string;
      lowFrequencyUsers?: string[];
      entries?: Array<{
        entryNumber?: string; lineNumber?: number; entryDate?: string; accountCode?: string; accountName?: string;
        debitMinor?: string | number; creditMinor?: string | number; description?: string; userName?: string; isManual?: boolean;
      }>;
    }>(request);
    if (!input.actor?.trim() || !Array.isArray(input.entries) || input.entries.length === 0) return problem('JOURNAL_INPUT_REQUIRED', 'actor and entries are required');
    const sourceVersion = input.sourceVersion?.trim() || phaseANow();
    const runId = phaseAId(); const at = phaseANow();
    const statements: D1PreparedStatement[] = [];
    let flagged = 0;
    try {
      for (const [index, entry] of input.entries.entries()) {
        if (!entry.entryNumber?.trim() || !entry.accountCode?.trim()) return problem('JOURNAL_ROW_INVALID', `entryNumber and accountCode are required at row ${index + 1}`);
        const entryId = phaseAId();
        const debit = safeMinor(entry.debitMinor ?? 0); const credit = safeMinor(entry.creditMinor ?? 0);
        statements.push(env.DB.prepare(`
          INSERT INTO journal_entries
          (id, engagement_id, source_version, entry_number, line_number, entry_date, account_code, account_name, debit_minor, credit_minor, description, user_name, is_manual, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(entryId, engagementId, sourceVersion, entry.entryNumber.trim(), Number.isInteger(entry.lineNumber) ? entry.lineNumber! : index + 1, entry.entryDate || null,
          entry.accountCode.trim(), entry.accountName?.trim() || '', debit, credit, entry.description?.trim() || '', entry.userName?.trim() || null, entry.isManual ? 1 : 0, at));
        const analysis = analyzeJournalEntry({ id: entryId, entryDate: entry.entryDate, debitMinor: BigInt(debit), creditMinor: BigInt(credit), isManual: entry.isManual, userName: entry.userName }, {
          periodEnd: input.periodEnd || String(engagement.period_end ?? ''), lowFrequencyUsers: input.lowFrequencyUsers,
        });
        flagged += analysis.signals.length;
        for (const signal of analysis.signals) {
          statements.push(env.DB.prepare(`
            INSERT INTO journal_review_items (id, engagement_id, run_id, journal_entry_id, signal_code, severity, rationale, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
          `).bind(phaseAId(), engagementId, runId, entryId, signal.code, signal.severity, signal.rationale, at));
        }
      }
    } catch (error) {
      if (error instanceof RangeError) return problem('MONEY_RANGE_UNSUPPORTED', error.message, 422);
      throw error;
    }
    statements.unshift(env.DB.prepare(`
      INSERT INTO journal_review_runs (id, engagement_id, engine_version, source_version, parameters_json, total_entries, flagged_entries, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(runId, engagementId, JOURNAL_ENGINE_VERSION, sourceVersion, JSON.stringify({ periodEnd: input.periodEnd || engagement.period_end, lowFrequencyUsers: input.lowFrequencyUsers ?? [] }), input.entries.length, flagged, input.actor.trim(), at));
    statements.push(auditEventStatement(env, { engagementId, entityType: 'journal_review_run', entityId: runId, action: 'journal_review.created', actor: input.actor.trim(), occurredAt: at, payload: { engineVersion: JOURNAL_ENGINE_VERSION, totalEntries: input.entries.length, flaggedEntries: flagged, sourceVersion } }));
    await env.DB.batch(statements);
    return respond({ id: runId, engineVersion: JOURNAL_ENGINE_VERSION, totalEntries: input.entries.length, flaggedEntries: flagged }, 201);
  }

  const decision = path.match(/^\/api\/v1\/journal-review-items\/([^/]+)\/decisions$/);
  if (decision && request.method === 'POST') {
    const item = await env.DB.prepare('SELECT * FROM journal_review_items WHERE id = ?').bind(decision[1]).first<Record<string, unknown>>();
    if (!item) return problem('JOURNAL_REVIEW_ITEM_NOT_FOUND', 'Journal review item not found', 404);
    const existing = await env.DB.prepare('SELECT id FROM journal_review_decisions WHERE review_item_id = ?').bind(decision[1]).first();
    if (existing) return problem('JOURNAL_DECISION_EXISTS', 'Journal review item already has a decision', 409);
    const input = await body<{ disposition?: string; rationale?: string; actor?: string; actorRole?: string }>(request);
    if (!input.actor?.trim() || !input.rationale?.trim() || !input.disposition?.trim() || !input.actorRole) return problem('JOURNAL_DECISION_REQUIRED', 'disposition, rationale, actor and actorRole are required');
    if (input.actorRole === 'ai_agent' || input.actorRole === 'client') return problem('JOURNAL_HUMAN_REVIEW_REQUIRED', 'Journal review decisions require a human reviewer', 409);
    const id = phaseAId(); const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO journal_review_decisions (id, engagement_id, review_item_id, disposition, rationale, actor_role, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, String(item.engagement_id), decision[1], input.disposition.trim(), input.rationale.trim(), input.actorRole, input.actor.trim(), at),
      env.DB.prepare("UPDATE journal_review_items SET status = 'reviewed' WHERE id = ?").bind(decision[1]),
      auditEventStatement(env, { engagementId: String(item.engagement_id), entityType: 'journal_review_item', entityId: decision[1], action: 'journal_review.decided', actor: input.actor.trim(), occurredAt: at, payload: { disposition: input.disposition.trim(), rationale: input.rationale.trim(), signalCode: item.signal_code } }),
    ]);
    return respond({ id, reviewItemId: decision[1], status: 'reviewed' }, 201);
  }

  const sampling = path.match(/^\/api\/v1\/engagements\/([^/]+)\/sampling-runs$/);
  if (sampling && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM sampling_runs WHERE engagement_id = ? ORDER BY created_at DESC').bind(sampling[1]).all();
    return respond({ runs: result.results ?? [] });
  }
  if (sampling && request.method === 'POST') {
    const engagementId = sampling[1];
    const exists = await env.DB.prepare('SELECT id FROM engagements WHERE id = ?').bind(engagementId).first();
    if (!exists) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const input = await body<{ populationIds?: string[]; method?: 'random'|'systematic'|'mus'; size?: number; seed?: number; actor?: string; populationSource?: string }>(request);
    if (!input.actor?.trim() || !input.populationSource?.trim() || !input.populationIds || !input.method || !Number.isInteger(input.size) || !Number.isInteger(input.seed)) return problem('SAMPLING_INPUT_REQUIRED', 'populationIds, method, size, seed, populationSource and actor are required');
    let result;
    try { result = selectSample({ populationIds: input.populationIds, method: input.method, size: input.size!, seed: input.seed! }); }
    catch (error) { return problem('SAMPLING_INPUT_INVALID', error instanceof Error ? error.message : 'Invalid sample input', 422); }
    const id = phaseAId(); const at = phaseANow();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO sampling_runs (id, engagement_id, population_source, method, seed, parameters_json, selected_ids_json, engine_version, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, engagementId, input.populationSource.trim(), result.method, result.seed, JSON.stringify({ requestedSize: result.requestedSize, populationSize: result.populationSize }), JSON.stringify(result.selectedIds), result.engineVersion, input.actor.trim(), at),
      auditEventStatement(env, { engagementId, entityType: 'sampling_run', entityId: id, action: 'sampling.created', actor: input.actor.trim(), occurredAt: at, payload: { method: result.method, seed: result.seed, populationSize: result.populationSize, requestedSize: result.requestedSize, engineVersion: result.engineVersion } }),
    ]);
    return respond({ id, ...result }, 201);
  }

  return null;
}
