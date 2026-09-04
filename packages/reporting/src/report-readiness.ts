export interface ReportReadiness {
  evidenceComplete: boolean;
  findingsReviewed: boolean;
  qualityApproved: boolean;
  score: number;
}

export function calculateReportReadiness(input: Omit<ReportReadiness,'score'>): ReportReadiness {
  const checks = [input.evidenceComplete, input.findingsReviewed, input.qualityApproved];
  return {
    ...input,
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100)
  };
}
