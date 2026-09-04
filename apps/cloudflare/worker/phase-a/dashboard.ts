import { buildAnalyticsSummary } from '../../../../packages/audit-engine/src/analytics-summary';
import { computeAuditReadiness } from '../../../../packages/audit-engine/src/readiness';
import { buildKosifCommandMetrics } from './kosif-metrics';
import { AUDIT_STAGES, type PhaseAEnv } from './types';

const asNumber = (value: unknown) => Number(value ?? 0);
const asText = (value: unknown) => String(value ?? '0');

function currentAuditStage(status: string) {
  switch (status) {
    case 'draft':
    case 'acceptance': return 'acceptance';
    case 'planning': return 'planning';
    case 'fieldwork': return 'procedures';
    case 'review': return 'review';
    case 'reporting': return 'reporting';
    case 'archived': return 'archive';
    case 'on_hold': return 'planning';
    default: return 'planning';
  }
}

export async function buildCommandCenter(env: PhaseAEnv, engagementId: string) {
  const engagement = await env.DB.prepare('SELECT * FROM engagements WHERE id = ?')
    .bind(engagementId)
    .first<Record<string, unknown>>();
  if (!engagement) return null;

  const [
    tbTotals,
    mappingStats,
    latestMateriality,
    riskStats,
    evidenceStats,
    findingStats,
    pbcStats,
    reviewStats,
    procedureStats,
    journalStats,
    traceStats,
    roundStats,
    latestCouncil,
    latestReport,
    recentEvents,
  ] = await Promise.all([
    env.DB.prepare(`
      SELECT COUNT(*) AS line_count,
             CAST(COALESCE(SUM(debit_minor), 0) AS TEXT) AS total_debit,
             CAST(COALESCE(SUM(credit_minor), 0) AS TEXT) AS total_credit
      FROM trial_balance_lines WHERE engagement_id = ?
    `).bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT COUNT(*) AS total,
             COALESCE(SUM(CASE WHEN (
               SELECT m.status FROM account_mappings m
               WHERE m.tb_line_id = t.id
               ORDER BY m.version DESC, m.created_at DESC LIMIT 1
             ) = 'approved' THEN 1 ELSE 0 END), 0) AS approved
      FROM trial_balance_lines t WHERE t.engagement_id = ?
    `).bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`SELECT status, version, amount_minor FROM materiality_assessments WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 1`)
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN level = 'high' AND status != 'closed' THEN 1 ELSE 0 END), 0) AS high_open,
        COALESCE(SUM(CASE WHEN level = 'medium' AND status != 'closed' THEN 1 ELSE 0 END), 0) AS medium_open
      FROM risks WHERE engagement_id = ?
    `).bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM evidence WHERE engagement_id = ?')
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM findings WHERE engagement_id = ? AND status != 'resolved'")
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM pbc_requests WHERE engagement_id = ? AND status != 'accepted'")
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM review_notes WHERE engagement_id = ? AND status = 'open'")
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT COUNT(DISTINCT p.id) AS procedures,
             COALESCE(SUM(CASE WHEN pr.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_runs
      FROM procedures p
      LEFT JOIN procedure_runs pr ON pr.procedure_id = p.id
      WHERE p.engagement_id = ?
    `).bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT
        COALESCE((SELECT flagged_entries FROM journal_review_runs WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 1), 0) AS flagged,
        COALESCE((SELECT COUNT(*) FROM journal_review_items WHERE engagement_id = ? AND status = 'pending'), 0) AS pending
    `).bind(engagementId, engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT COUNT(DISTINCT evidence_id) AS linked
      FROM evidence_links WHERE engagement_id = ?
    `).bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN rd.status = 'complete' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN rd.status = 'attention' THEN 1 ELSE 0 END), 0) AS attention
      FROM round_decisions rd
      JOIN (
        SELECT round_code, MAX(version) AS version
        FROM round_decisions WHERE engagement_id = ? GROUP BY round_code
      ) latest ON latest.round_code = rd.round_code AND latest.version = rd.version
      WHERE rd.engagement_id = ?
    `).bind(engagementId, engagementId).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT id, status, task, human_decision, created_at, reviewed_at FROM council_runs WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT id, version, status, created_at, approved_at FROM report_versions WHERE engagement_id = ? ORDER BY version DESC LIMIT 1')
      .bind(engagementId).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT id, entity_type, entity_id, action, actor, created_at FROM audit_events WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 20')
      .bind(engagementId).all<Record<string, unknown>>(),
  ]);

  const lineCount = asNumber(tbTotals?.line_count);
  const totalDebit = BigInt(asText(tbTotals?.total_debit));
  const totalCredit = BigInt(asText(tbTotals?.total_credit));
  const approvedMappings = asNumber(mappingStats?.approved);
  const unmappedAccounts = Math.max(0, lineCount - approvedMappings);
  const highRiskCount = asNumber(riskStats?.high_open);
  const mediumRiskCount = asNumber(riskStats?.medium_open);
  const evidenceCount = asNumber(evidenceStats?.count);
  const openFindings = asNumber(findingStats?.count);
  const openPbc = asNumber(pbcStats?.count);
  const openReviewNotes = asNumber(reviewStats?.count);
  const reportApproved = latestReport?.status === 'approved';

  const readiness = computeAuditReadiness({
    tbBalanced: lineCount > 0 && totalDebit === totalCredit,
    unmappedAccounts,
    unapprovedMateriality: latestMateriality?.status === 'approved' ? 0 : 1,
    openHighRisks: highRiskCount,
    openPbc,
    openReviewNotes,
    openFindings,
    evidenceCount,
    reportApproved,
  });

  const analytics = buildAnalyticsSummary({
    totalDebit,
    totalCredit,
    accountCount: lineCount,
    highRiskCount,
    mediumRiskCount,
    openFindingCount: openFindings,
  });

  const kosifMetrics = buildKosifCommandMetrics({
    journalFlagged: asNumber(journalStats?.flagged),
    journalPendingReview: asNumber(journalStats?.pending),
    traceEvidence: evidenceCount,
    traceLinkedEvidence: asNumber(traceStats?.linked),
    completedRounds: asNumber(roundStats?.completed),
    attentionRounds: asNumber(roundStats?.attention),
  });

  const activeStage = currentAuditStage(String(engagement.status ?? 'planning'));

  return {
    engagement,
    readiness,
    metrics: {
      trialBalanceLines: lineCount,
      approvedMappings,
      unmappedAccounts,
      openHighRisks: highRiskCount,
      openMediumRisks: mediumRiskCount,
      openPbc,
      evidenceCount,
      openReviewNotes,
      openFindings,
      procedures: asNumber(procedureStats?.procedures),
      completedProcedureRuns: asNumber(procedureStats?.completed_runs),
      ...kosifMetrics,
    },
    stages: AUDIT_STAGES.map((stage) => ({ id: stage, state: stage === activeStage ? 'current' : 'available' })),
    analytics: {
      ...analytics,
      totalDebitMinor: analytics.totalDebitMinor.toString(),
      totalCreditMinor: analytics.totalCreditMinor.toString(),
      tbDifferenceMinor: analytics.tbDifferenceMinor.toString(),
    },
    council: latestCouncil ?? null,
    report: latestReport ?? null,
    recentEvents: recentEvents.results ?? [],
  };
}
