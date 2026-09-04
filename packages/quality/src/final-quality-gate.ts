export interface QualityGateResult { passed:boolean; checks:string[]; issues:string[]; }
export function runQualityGate():QualityGateResult{return {passed:false,checks:[],issues:[]};}
