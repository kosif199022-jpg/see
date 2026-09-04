export interface ReportSection {
  title: string;
  content: string;
  sourceIds: string[];
}

export interface AuditReport {
  id: string;
  version: number;
  sections: ReportSection[];
}

export function createReport(id: string, sections: ReportSection[]): AuditReport {
  return {
    id,
    version: 1,
    sections,
  };
}
