export interface PhaseAEnv {
  DB: D1Database;
  EVIDENCE: R2Bucket;
  ALLOW_PUBLIC_DEMO?: string;
  APP_ACCESS_TOKEN?: string;
}

export const PRIMARY_WORKSPACES = ['home', 'audit', 'analytics', 'council', 'more'] as const;
export type PrimaryWorkspace = typeof PRIMARY_WORKSPACES[number];

export const AUDIT_STAGES = [
  'acceptance',
  'planning',
  'pbc',
  'data_intake',
  'mapping',
  'materiality',
  'risk',
  'procedures',
  'evidence',
  'workpapers',
  'review',
  'misstatements',
  'reporting',
  'archive',
] as const;
export type AuditStage = typeof AUDIT_STAGES[number];

export const TRACE_TARGETS = [
  'trial_balance_line',
  'risk',
  'procedure',
  'procedure_run',
  'workpaper',
  'finding',
  'report_version',
  'council_run',
] as const;
export type TraceTargetType = typeof TRACE_TARGETS[number];

export interface CommandCenterMetrics {
  trialBalanceLines: number;
  approvedMappings: number;
  unmappedAccounts: number;
  openHighRisks: number;
  openMediumRisks: number;
  openPbc: number;
  evidenceCount: number;
  openReviewNotes: number;
  openFindings: number;
  procedures: number;
  completedProcedureRuns: number;
  journalFlagged: number;
  journalPendingReview: number;
  roundsReady: number;
  traceHealth: number;
}
