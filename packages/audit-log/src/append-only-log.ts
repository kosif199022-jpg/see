export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
};

const events: AuditEvent[] = [];

export function appendAuditEvent(event: AuditEvent) {
  events.push(event);
  return event;
}

export function getAuditEvents() {
  return [...events];
}
