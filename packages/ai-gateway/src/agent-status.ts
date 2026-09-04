export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentExecution {
  agent: string;
  status: AgentStatus;
}
