export type FindingStatus = 'open' | 'review' | 'resolved' | 'closed';

export interface Finding {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: FindingStatus;
  evidenceIds: string[];
}

export function createFinding(id: string, title: string): Finding {
  return {
    id,
    title,
    severity: 'medium',
    status: 'open',
    evidenceIds: []
  };
}
