export type AuditStage =
  | 'INGESTION'
  | 'VALIDATION'
  | 'MAPPING'
  | 'ANALYSIS'
  | 'RISK'
  | 'EVIDENCE'
  | 'REPORT';

export interface AuditRunState {
  runId: string;
  stage: AuditStage;
  completed: AuditStage[];
  status: 'running' | 'completed' | 'failed';
}

export function createAuditRun(runId: string): AuditRunState {
  return {
    runId,
    stage: 'INGESTION',
    completed: [],
    status: 'running'
  };
}
