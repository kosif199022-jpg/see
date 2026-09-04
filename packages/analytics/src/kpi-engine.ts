export interface AuditKPI {
 name:string;
 value:number;
}

export function calculateReadiness(completed:number,total:number):AuditKPI {
 return {name:'Audit Readiness', value: total===0?0:Math.round((completed/total)*100)};
}
