export interface RiskDashboardItem {
  area: string;
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
}

export function createRiskItem(area: string, score: number): RiskDashboardItem {
  return {
    area,
    score,
    severity: score >= 80 ? 'HIGH' : 'MEDIUM',
    reasons: []
  };
}
