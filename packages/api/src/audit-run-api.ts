export type AuditRunRequest = {
  engagementId: string;
  sourceFileId: string;
};

export type AuditRunResponse = {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
};

export function startAuditRun(request: AuditRunRequest): AuditRunResponse {
  return {
    runId: `run-${request.engagementId}`,
    status: 'queued'
  };
}
