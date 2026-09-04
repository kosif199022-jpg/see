export type EvidenceState = 'REQUESTED' | 'RECEIVED' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

export interface EvidenceLifecycle {
 id:string;
 state:EvidenceState;
 source?:string;
}

export function requestEvidence(id:string):EvidenceLifecycle {
 return {id,state:'REQUESTED'};
}
