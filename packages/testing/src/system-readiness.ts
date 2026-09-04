export interface SystemReadiness {
  api: boolean;
  database: boolean;
  auditEngine: boolean;
}

export function getReadiness(): SystemReadiness {
  return { api: true, database: true, auditEngine: true };
}
