export interface TrialBalanceLine {
  account: string;
  debit: bigint;
  credit: bigint;
}

export interface TrialBalanceValidation {
  balanced: boolean;
  totalDebit: bigint;
  totalCredit: bigint;
  errors: string[];
}

export function validateTrialBalance(lines: TrialBalanceLine[]): TrialBalanceValidation {
  const errors: string[] = [];
  let totalDebit = 0n;
  let totalCredit = 0n;

  if (lines.length === 0) errors.push('Trial balance must contain at least one line');

  for (const [index, line] of lines.entries()) {
    if (!line.account.trim()) errors.push(`Line ${index + 1}: account is required`);
    if (line.debit < 0n || line.credit < 0n) errors.push(`Line ${index + 1}: amounts cannot be negative`);
    totalDebit += line.debit;
    totalCredit += line.credit;
  }

  if (totalDebit !== totalCredit) {
    errors.push(`Trial balance does not balance: debit=${totalDebit} credit=${totalCredit}`);
  }

  return { balanced: errors.length === 0, totalDebit, totalCredit, errors };
}

export interface MaterialityInput {
  benchmark: bigint;
  percentageBasisPoints: number;
}

export function calculateMateriality(input: MaterialityInput) {
  if (input.benchmark < 0n) throw new Error('benchmark must be non-negative');
  if (!Number.isInteger(input.percentageBasisPoints) || input.percentageBasisPoints < 1 || input.percentageBasisPoints > 10_000) {
    throw new Error('percentageBasisPoints must be an integer between 1 and 10000');
  }
  return {
    amount: (input.benchmark * BigInt(input.percentageBasisPoints)) / 10_000n,
    version: 'SEE-MATERIALITY-v2' as const,
  };
}

export interface RiskInput {
  likelihood: number;
  magnitude: number;
  controlReliance: number;
  rationale: string;
}

export function scoreRisk(input: RiskInput) {
  for (const [key, value] of Object.entries({
    likelihood: input.likelihood,
    magnitude: input.magnitude,
    controlReliance: input.controlReliance,
  })) {
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`${key} must be an integer from 1 to 5`);
  }
  if (!input.rationale.trim()) throw new Error('risk rationale is required');

  const inherent = input.likelihood * input.magnitude * 5;
  const controlAdjustment = (input.controlReliance - 1) * 10;
  const score = Math.max(0, Math.min(100, inherent - controlAdjustment));
  const level = score >= 75 ? 'high' : score >= 40 ? 'medium' : 'low';

  return { score, level, rationale: input.rationale.trim(), version: 'SEE-RISK-v1' as const };
}

export interface AuditSummaryInput {
  engagementName: string;
  unapprovedMappings: number;
  openHighRisks: number;
  unresolvedFindings: number;
  evidenceCount: number;
}

export function summarizeAudit(input: AuditSummaryInput) {
  const blockers: string[] = [];
  if (input.unapprovedMappings > 0) blockers.push(`${input.unapprovedMappings} mapping(s) awaiting approval`);
  if (input.openHighRisks > 0) blockers.push(`${input.openHighRisks} high risk(s) remain open`);
  if (input.unresolvedFindings > 0) blockers.push(`${input.unresolvedFindings} finding(s) remain unresolved`);
  if (input.evidenceCount === 0) blockers.push('no evidence registered');

  const readyForHumanSignoff = blockers.length === 0;
  return {
    engagementName: input.engagementName,
    readyForHumanSignoff,
    blockers,
    status: readyForHumanSignoff
      ? 'Ready for human sign-off; no statutory opinion is issued automatically.'
      : `Human sign-off required before any audit opinion. ${blockers.join('; ')}`,
  };
}
