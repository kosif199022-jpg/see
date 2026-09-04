export interface CommandCenterSummary {
  engagementId: string;
  risks: number;
  findings: number;
  evidencePending: number;
}

export function buildCommandCenterSummary(engagementId: string): CommandCenterSummary {
  return { engagementId, risks: 0, findings: 0, evidencePending: 0 };
}
