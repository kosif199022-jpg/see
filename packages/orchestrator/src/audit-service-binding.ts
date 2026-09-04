export type AuditServiceName='risk'|'evidence'|'report';

export interface ServiceBinding { name:AuditServiceName; enabled:boolean }

export const defaultServices:ServiceBinding[]=[
 {name:'risk',enabled:true},
 {name:'evidence',enabled:true},
 {name:'report',enabled:true}
];
