export interface AnalyticsSummaryInput {
  totalDebit: bigint;
  totalCredit: bigint;
  accountCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  openFindingCount: number;
}

export interface AnalyticsSummary {
  totalDebitMinor: bigint;
  totalCreditMinor: bigint;
  tbDifferenceMinor: bigint;
  accountCount: number;
  riskMix: {
    high: number;
    medium: number;
  };
  openFindingCount: number;
  authority: 'indicator';
  method: 'SEE-ANALYTICS-SUMMARY-v1';
}

function nonNegativeCount(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

export function buildAnalyticsSummary(input: AnalyticsSummaryInput): AnalyticsSummary {
  if (input.totalDebit < 0n || input.totalCredit < 0n) {
    throw new Error('trial balance totals must be non-negative minor units');
  }

  return {
    totalDebitMinor: input.totalDebit,
    totalCreditMinor: input.totalCredit,
    tbDifferenceMinor: input.totalDebit - input.totalCredit,
    accountCount: nonNegativeCount(input.accountCount, 'accountCount'),
    riskMix: {
      high: nonNegativeCount(input.highRiskCount, 'highRiskCount'),
      medium: nonNegativeCount(input.mediumRiskCount, 'mediumRiskCount'),
    },
    openFindingCount: nonNegativeCount(input.openFindingCount, 'openFindingCount'),
    authority: 'indicator',
    method: 'SEE-ANALYTICS-SUMMARY-v1',
  };
}
