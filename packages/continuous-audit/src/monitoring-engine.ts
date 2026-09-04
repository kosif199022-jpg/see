export interface AuditAlert {
  id: string;
  source: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export function createAlert(source: string, message: string): AuditAlert {
  return {
    id: crypto.randomUUID(),
    source,
    severity: 'MEDIUM',
    message
  };
}
