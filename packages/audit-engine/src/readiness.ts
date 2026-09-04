export interface AuditReadinessInput {
  tbBalanced: boolean;
  unmappedAccounts: number;
  unapprovedMateriality: number;
  openHighRisks: number;
  openPbc: number;
  openReviewNotes: number;
  openFindings: number;
  evidenceCount: number;
  reportApproved: boolean;
}

export interface AuditReadinessBlocker {
  code: string;
  message: string;
  count?: number;
}

export interface AuditReadiness {
  score: number;
  label: 'blocked' | 'in_progress' | 'ready_for_human_review';
  readyForArchive: boolean;
  blockers: AuditReadinessBlocker[];
  method: 'SEE-READINESS-v1';
}

function count(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function blocker(code: string, message: string, value?: number): AuditReadinessBlocker {
  return value === undefined ? { code, message } : { code, message, count: value };
}

export function computeAuditReadiness(input: AuditReadinessInput): AuditReadiness {
  const unmappedAccounts = count(input.unmappedAccounts, 'unmappedAccounts');
  const unapprovedMateriality = count(input.unapprovedMateriality, 'unapprovedMateriality');
  const openHighRisks = count(input.openHighRisks, 'openHighRisks');
  const openPbc = count(input.openPbc, 'openPbc');
  const openReviewNotes = count(input.openReviewNotes, 'openReviewNotes');
  const openFindings = count(input.openFindings, 'openFindings');
  const evidenceCount = count(input.evidenceCount, 'evidenceCount');

  const professionalBlockers: AuditReadinessBlocker[] = [];

  if (!input.tbBalanced) professionalBlockers.push(blocker('TB_NOT_BALANCED', 'Trial balance is not balanced.'));
  if (unmappedAccounts > 0) professionalBlockers.push(blocker('UNMAPPED_ACCOUNTS', 'Accounts remain unmapped.', unmappedAccounts));
  if (unapprovedMateriality > 0) professionalBlockers.push(blocker('MATERIALITY_NOT_APPROVED', 'Materiality requires human approval.', unapprovedMateriality));
  if (openHighRisks > 0) professionalBlockers.push(blocker('OPEN_HIGH_RISKS', 'High risks remain open.', openHighRisks));
  if (openPbc > 0) professionalBlockers.push(blocker('PBC_INCOMPLETE', 'PBC requests remain incomplete.', openPbc));
  if (openReviewNotes > 0) professionalBlockers.push(blocker('OPEN_REVIEW_NOTES', 'Review notes remain open.', openReviewNotes));
  if (openFindings > 0) professionalBlockers.push(blocker('OPEN_FINDINGS', 'Findings remain unresolved.', openFindings));
  if (evidenceCount === 0) professionalBlockers.push(blocker('NO_EVIDENCE', 'No evidence is registered.'));

  let score = 100;
  if (!input.tbBalanced) score -= 30;
  score -= Math.min(20, unmappedAccounts * 4);
  if (unapprovedMateriality > 0) score -= 10;
  score -= Math.min(20, openHighRisks * 10);
  score -= Math.min(10, openPbc * 2);
  score -= Math.min(10, openReviewNotes * 2);
  score = Math.max(0, Math.min(100, score));

  const blockers = [...professionalBlockers];
  if (!input.reportApproved) {
    blockers.push(blocker('REPORT_NOT_APPROVED', 'Final report still requires human approval.'));
  }

  const label: AuditReadiness['label'] = !input.tbBalanced
    ? 'blocked'
    : professionalBlockers.length > 0
      ? 'in_progress'
      : 'ready_for_human_review';

  return {
    score,
    label,
    readyForArchive: professionalBlockers.length === 0 && input.reportApproved,
    blockers,
    method: 'SEE-READINESS-v1',
  };
}
