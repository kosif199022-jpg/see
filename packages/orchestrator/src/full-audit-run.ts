export type AuditPhase =
  | 'INGESTION'
  | 'VALIDATION'
  | 'MAPPING'
  | 'ANALYSIS'
  | 'RISK'
  | 'EVIDENCE'
  | 'WORKPAPERS'
  | 'QUALITY'
  | 'REPORT';

export interface AuditExecution {
  id: string;
  phases: AuditPhase[];
  status: 'running' | 'completed' | 'failed';
}

export function startAuditExecution(id: string): AuditExecution {
  return {
    id,
    phases: ['INGESTION'],
    status: 'running'
  };
}
