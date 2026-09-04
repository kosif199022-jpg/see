export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
};

export class EventStore {
  private events: AuditEvent[] = [];

  append(event: AuditEvent) {
    this.events.push(event);
    return event;
  }

  list() {
    return [...this.events];
  }
}
