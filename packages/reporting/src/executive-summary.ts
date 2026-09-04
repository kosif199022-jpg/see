export interface ExecutiveSummary { risks:string[]; findings:string[]; recommendations:string[]; }
export function createExecutiveSummary():ExecutiveSummary{return {risks:[],findings:[],recommendations:[]};}
