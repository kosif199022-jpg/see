export interface AgentOpinion {
  agent: string;
  confidence: number;
  observations: string[];
}

export interface ConsensusResult {
  confidence: number;
  observations: string[];
}

export function buildConsensus(opinions: AgentOpinion[]): ConsensusResult {
  const confidence = opinions.length === 0
    ? 0
    : opinions.reduce((sum, item) => sum + item.confidence, 0) / opinions.length;

  return {
    confidence,
    observations: opinions.flatMap(item => item.observations)
  };
}
