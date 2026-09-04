export interface ExecutionContext {
  engagementId: string;
  runId: string;
  stage: string;
  startedAt: string;
}

export function createExecutionContext(engagementId: string, runId: string): ExecutionContext {
  return {
    engagementId,
    runId,
    stage: 'INGESTION',
    startedAt: new Date().toISOString()
  };
}
