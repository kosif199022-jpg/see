export type PrimaryWorkspace = 'home' | 'audit' | 'analytics' | 'council' | 'more';

export type Engagement = {
  id: string;
  name: string;
  client_name: string;
  period_end: string;
  status: string;
};

export type LegacyDashboard = {
  engagement: Engagement;
  trialBalance: { lines: Array<Record<string, any>>; validation: { balanced: boolean; totalDebit: string; totalCredit: string; errors: string[] } };
  mappings: Array<Record<string, any>>;
  materiality: Array<Record<string, any>>;
  risks: Array<Record<string, any>>;
  evidence: Array<Record<string, any>>;
  findings: Array<Record<string, any>>;
  events: Array<Record<string, any>>;
  summary: { readyForHumanSignoff: boolean; blockers: string[]; status: string };
};

export type ReadinessBlocker = { code: string; message: string; count?: number };
export type CommandCenter = {
  engagement: Engagement;
  readiness: {
    score: number;
    label: 'blocked' | 'in_progress' | 'ready_for_human_review';
    readyForArchive: boolean;
    blockers: ReadinessBlocker[];
    method: 'SEE-READINESS-v1';
  };
  metrics: {
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
  };
  stages: Array<{ id: string; state: string }>;
  analytics: {
    totalDebitMinor: string;
    totalCreditMinor: string;
    tbDifferenceMinor: string;
    accountCount: number;
    riskMix: { high: number; medium: number };
    openFindingCount: number;
    authority: 'indicator';
    method: 'SEE-ANALYTICS-SUMMARY-v1';
  };
  council: Record<string, any> | null;
  report: Record<string, any> | null;
  recentEvents: Array<Record<string, any>>;
};

export type PbcRequest = Record<string, any> & { id: string; title: string; status: string; priority: string };
export type Procedure = Record<string, any> & { id: string; title: string; status: string; objective: string };
export type Workpaper = Record<string, any> & { id: string; title: string; status: string; current_version: number };
export type CouncilRun = Record<string, any> & { id: string; task: string; status: string };
export type ReportVersion = Record<string, any> & { id: string; version: number; status: string };

export type TraceGraph = {
  nodes: Array<{ id: string; recordId: string; type: string; label: string; status?: string; sha256?: string }>;
  edges: Array<{ id: string; from: string; to: string; relation: string }>;
  summary: { evidenceNodes: number; linkedTargets: number; unlinkedEvidence: number };
};

export type Perform = (action: () => Promise<void>, success: string) => Promise<void>;
