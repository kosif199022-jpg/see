export interface ReportPackage {
  reportId: string;
  findings: string[];
  evidenceRefs: string[];
  version: string;
}

export function createReportPackage(reportId: string): ReportPackage {
  return { reportId, findings: [], evidenceRefs: [], version: 'SEE-REPORT-v1' };
}
