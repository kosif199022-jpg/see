export type AgentRole =
 | 'EngagementManager'
 | 'IFRSExpert'
 | 'ISAExpert'
 | 'FraudAnalyst'
 | 'DataAnalyst'
 | 'QualityReviewer';

export type CouncilResult = {
  role: AgentRole;
  claims: string[];
  evidenceGaps: string[];
  confidence: number;
};

export function createCouncilRun(roles:AgentRole[]): CouncilResult[]{
 return roles.map(role=>({role,claims:[],evidenceGaps:[],confidence:0}));
}
