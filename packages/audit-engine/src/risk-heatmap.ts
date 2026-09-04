export interface RiskPoint {
  id: string;
  name: string;
  likelihood: number;
  impact: number;
}

export function calculateRiskScore(risk: RiskPoint): number {
  return risk.likelihood * risk.impact;
}

export function buildHeatmap(risks: RiskPoint[]) {
  return risks.map(r => ({ ...r, score: calculateRiskScore(r) }));
}
