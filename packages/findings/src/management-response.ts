export interface ManagementResponse { findingId:string; response:string; actionPlan:string; owner?:string; status:'OPEN'|'IN_PROGRESS'|'COMPLETED'; }
