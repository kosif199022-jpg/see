export type AuditAgent =
  | 'EngagementManager'
  | 'IFRSExpert'
  | 'ISAExpert'
  | 'FraudAnalyst'
  | 'DataAnalyst'
  | 'QualityReviewer';

export interface AgentTask {
  agent: AuditAgent;
  task: string;
  status: 'pending' | 'running' | 'completed';
}

export function createAgentTask(agent: AuditAgent, task: string): AgentTask {
  return {
    agent,
    task,
    status: 'pending'
  };
}
