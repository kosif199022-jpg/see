export interface EvidenceFindingLink {
  evidenceId: string;
  findingId: string;
  relation: 'supports' | 'contradicts';
}

export function linkEvidenceToFinding(link: EvidenceFindingLink) {
  return link;
}
