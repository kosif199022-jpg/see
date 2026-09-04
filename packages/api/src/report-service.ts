export interface ReportRequest {
  engagementId: string;
  version: string;
}

export function createReportRequest(input: ReportRequest) {
  return { ...input, status: 'queued' };
}
