import { buildPhaseADemoSeed } from './demo-seed';
import type { PhaseAEnv } from './types';

export async function persistKosifDemoRecords(env: PhaseAEnv, engagementId: string): Promise<void> {
  const [risk, evidence, engagement] = await Promise.all([
    env.DB.prepare('SELECT id FROM risks WHERE engagement_id = ? ORDER BY created_at LIMIT 1').bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT id, name, sha256, status FROM evidence WHERE engagement_id = ? ORDER BY created_at LIMIT 1').bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT created_at FROM engagements WHERE id = ?').bind(engagementId).first<Record<string, unknown>>(),
  ]);
  if (!risk?.id || !evidence?.id || !engagement?.created_at) throw new Error('Demo base records missing before KOSIF seed');

  const seed = buildPhaseADemoSeed({
    engagementId,
    riskId: String(risk.id),
    evidenceId: String(evidence.id),
    createdAt: String(engagement.created_at),
    evidenceName: String(evidence.name ?? 'demo-evidence.txt'),
    evidenceSha256: String(evidence.sha256 ?? ''),
    evidenceStatus: String(evidence.status ?? 'registered'),
  });

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`INSERT INTO journal_entries
      (id, engagement_id, source_version, entry_number, line_number, entry_date, account_code, account_name, debit_minor, credit_minor, description, user_name, is_manual, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(seed.journalEntry.id, seed.journalEntry.engagementId, seed.journalEntry.sourceVersion, seed.journalEntry.entryNumber, seed.journalEntry.lineNumber, seed.journalEntry.entryDate, seed.journalEntry.accountCode, seed.journalEntry.accountName, seed.journalEntry.debitMinor, seed.journalEntry.creditMinor, seed.journalEntry.description, seed.journalEntry.userName, seed.journalEntry.isManual, seed.journalEntry.createdAt),
    env.DB.prepare(`INSERT INTO journal_review_runs
      (id, engagement_id, engine_version, source_version, parameters_json, total_entries, flagged_entries, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(seed.journalRun.id, seed.journalRun.engagementId, seed.journalRun.engineVersion, seed.journalRun.sourceVersion, seed.journalRun.parametersJson, seed.journalRun.totalEntries, seed.journalRun.flaggedEntries, seed.journalRun.createdBy, seed.journalRun.createdAt),
    env.DB.prepare(`INSERT INTO journal_review_items
      (id, engagement_id, run_id, journal_entry_id, signal_code, severity, rationale, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(seed.journalReviewItem.id, seed.journalReviewItem.engagementId, seed.journalReviewItem.runId, seed.journalReviewItem.journalEntryId, seed.journalReviewItem.signalCode, seed.journalReviewItem.severity, seed.journalReviewItem.rationale, seed.journalReviewItem.status, seed.journalReviewItem.createdAt),
    env.DB.prepare(`INSERT INTO standard_usages
      (id, engagement_id, standard_code, source_family, source_version, target_type, target_id, rationale, actor, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(seed.standardUsage.id, seed.standardUsage.engagementId, seed.standardUsage.standardCode, seed.standardUsage.sourceFamily, seed.standardUsage.sourceVersion, seed.standardUsage.targetType, seed.standardUsage.targetId, seed.standardUsage.rationale, seed.standardUsage.actor, seed.standardUsage.createdAt),
    ...seed.roundDecisions.map((round) => env.DB.prepare(`INSERT INTO round_decisions
      (id, engagement_id, round_code, status, rationale, actor, actor_role, version, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(round.id, round.engagementId, round.roundCode, round.status, round.rationale, round.actor, round.actorRole, round.version, round.updatedAt)),
  ];

  await env.DB.batch(statements);
}
