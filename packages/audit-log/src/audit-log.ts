export type AuditEvent={
 id:string;
 actor:string;
 action:string;
 timestamp:string;
 hash?:string;
};

export function appendEvent(event:AuditEvent, log:AuditEvent[]){
 return [...log,event];
}
