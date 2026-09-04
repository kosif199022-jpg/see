export type FindingStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface Finding {
  id: string;
  title: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceIds: string[];
  status: FindingStatus;
}

export function createFinding(input: Omit<Finding, 'status'>): Finding {
  return { ...input, status: 'OPEN' };
}
