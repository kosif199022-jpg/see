export type AuditStage = 'upload' | 'validate' | 'map' | 'analyze' | 'risk' | 'evidence' | 'report';

export interface AuditRun {
  id: string;
  stage: AuditStage;
  completed: AuditStage[];
  status: 'running' | 'completed' | 'blocked';
}

export function createAuditRun(id:string): AuditRun {
  return { id, stage:'upload', completed:[], status:'running' };
}

export function advanceStage(run:AuditRun, next:AuditStage):AuditRun {
  return {...run, stage:next, completed:[...run.completed, next]};
}
