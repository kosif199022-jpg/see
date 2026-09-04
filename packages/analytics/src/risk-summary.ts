export interface RiskSummary {
  high: number;
  medium: number;
  low: number;
}

export function summarizeRisk(risks: string[]) {
  return { total: risks.length };
}
