export type ServiceName = 'risk' | 'evidence' | 'workpapers' | 'report';

export interface AuditServiceRegistry {
  services: ServiceName[];
}

export const defaultRegistry: AuditServiceRegistry = {
  services: ['risk','evidence','workpapers','report']
};
