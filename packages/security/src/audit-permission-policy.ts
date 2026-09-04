export type AuditPermission = 'VIEW' | 'EDIT' | 'APPROVE';

export function canPerform(role:string, permission:AuditPermission):boolean {
 if(role==='partner') return true;
 if(permission==='VIEW') return true;
 return role!=='client';
}
