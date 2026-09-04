export type ReportSection = {
  id: string;
  title: string;
  content: string;
  sourceIds: string[];
};

export function buildReport(sections: ReportSection[]) {
  return {
    version: 1,
    sections,
    generatedAt: new Date().toISOString()
  };
}
