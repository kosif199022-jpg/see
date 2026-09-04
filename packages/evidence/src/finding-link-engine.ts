export interface FindingLink {
  evidenceId: string;
  findingId: string;
  procedureId: string;
  confidence: number;
}

export function createFindingLink(
  evidenceId: string,
  findingId: string,
  procedureId: string
): FindingLink {
  return {
    evidenceId,
    findingId,
    procedureId,
    confidence: 0
  };
}
