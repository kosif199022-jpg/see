export type AuditRunStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface AuditRunRequest {
  engagementId: string;
  sourceFileId: string;
}

export interface AuditRunResponse {
  runId: string;
  status: AuditRunStatus;
}

export function startAuditRun(request: AuditRunRequest): AuditRunResponse {
  return {
    runId: `run-${request.engagementId}`,
    status: 'queued'
  };
}
