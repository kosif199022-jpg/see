export type AuditReport = {
  id: string;
  version: number;
  sections: string[];
  snapshotId: string;
};

export function createReport(snapshotId: string, sections: string[]): AuditReport {
  return {
    id: crypto.randomUUID(),
    version: 1,
    sections,
    snapshotId,
  };
}
