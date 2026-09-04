export interface AuditRunRequest {
  engagementId: string;
  sourceFileId: string;
}

export interface AuditRunResponse {
  runId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export function createAuditRunResponse(runId: string): AuditRunResponse {
  return {
    runId,
    status: 'QUEUED'
  };
}
