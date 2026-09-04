export type EvidenceItem = {
  id:string;
  source:string;
  linkedFinding?:string;
  verified:boolean;
};

export type EvidenceResponse = {
  items: EvidenceItem[];
  total:number;
};
