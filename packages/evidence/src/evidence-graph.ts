export type EvidenceNode = {
  id: string;
  type: 'document'|'account'|'risk'|'procedure'|'finding';
  label: string;
};

export type EvidenceEdge = {
  from: string;
  to: string;
  relation: string;
};

export class EvidenceGraph {
  nodes: EvidenceNode[] = [];
  edges: EvidenceEdge[] = [];

  addNode(node: EvidenceNode){ this.nodes.push(node); }
  link(edge: EvidenceEdge){ this.edges.push(edge); }

  trace(id:string){
    return this.edges.filter(e=>e.from===id || e.to===id);
  }
}
