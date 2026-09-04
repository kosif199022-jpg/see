export type PipelineStep = 'INGESTION' | 'VALIDATION' | 'MAPPING' | 'ANALYSIS' | 'RISK' | 'EVIDENCE' | 'REPORT';

export interface PipelineRun {
  id: string;
  steps: PipelineStep[];
  current: PipelineStep;
  status: 'running' | 'completed' | 'failed';
}

export function startPipeline(id:string): PipelineRun {
  return { id, steps: [], current: 'INGESTION', status: 'running' };
}
