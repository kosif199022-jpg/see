export type AuditRisk = {
  area: string;
  score: number;
  factors: string[];
  status: 'identified' | 'assessed' | 'responded';
};

export function calculateRisk(factors: string[]): AuditRisk {
  const score = Math.min(100, factors.length * 15);
  return {
    area: 'financial_review',
    score,
    factors,
    status: 'identified'
  };
}
