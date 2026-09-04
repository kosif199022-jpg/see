export type AuditExecutionStep =
  | 'UPLOAD'
  | 'VALIDATE'
  | 'MAP'
  | 'ANALYZE'
  | 'RISK'
  | 'EVIDENCE'
  | 'REPORT';

export interface AuditExecutionState {
  runId: string;
  completed: AuditExecutionStep[];
  current: AuditExecutionStep;
}

export function createExecution(runId: string): AuditExecutionState {
  return {
    runId,
    completed: [],
    current: 'UPLOAD'
  };
}
