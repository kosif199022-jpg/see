export interface EvidenceNode {
  id: string;
  type: 'evidence' | 'finding' | 'procedure' | 'risk';
  label: string;
}

export interface EvidenceLink {
  from: string;
  to: string;
  relation: string;
}

export function createEvidenceGraph(nodes: EvidenceNode[], links: EvidenceLink[]) {
  return { nodes, links, traceable: true };
}
