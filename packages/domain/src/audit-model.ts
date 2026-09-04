export type AuditEntityStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'locked';

export interface Provenance {
  sourceIds: string[];
  engine: string;
  engineVersion: string;
  inputHash: string;
}

export interface Engagement {
  id: string;
  clientName: string;
  period: string;
  status: AuditEntityStatus;
}

export interface Evidence {
  id: string;
  source: string;
  reliability: number;
  relevance: number;
  provenance: Provenance;
}

export interface Risk {
  id: string;
  area: string;
  assertion: string[];
  score: number;
  status: AuditEntityStatus;
}

export interface Workpaper {
  id: string;
  procedureId: string;
  conclusion: string;
  status: AuditEntityStatus;
}
