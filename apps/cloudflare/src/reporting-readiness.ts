export interface ReportingBlocker {
  code: string;
}

export function canRequestReportApproval(blockers: ReportingBlocker[]): boolean {
  return blockers.every((blocker) => blocker.code === 'REPORT_NOT_APPROVED');
}
