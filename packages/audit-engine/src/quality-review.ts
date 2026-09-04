export type QualityCheck = {
  id: string;
  area: string;
  passed: boolean;
  notes?: string;
};

export function reviewQuality(checks: QualityCheck[]) {
  return {
    total: checks.length,
    passed: checks.filter(c => c.passed).length,
    failed: checks.filter(c => !c.passed).length
  };
}
