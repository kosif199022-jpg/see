export interface FindingQuery { severity?:string; status?:string }

export function filterFindings<T extends {severity:string;status:string}>(items:T[],query:FindingQuery){
 return items.filter(i=>(!query.severity||i.severity===query.severity)&&(!query.status||i.status===query.status));
}
