export type ExtendedAgentRole =
 | 'EngagementManager'
 | 'AuditPlanner'
 | 'IFRSExpert'
 | 'ISAExpert'
 | 'FinancialAnalyst'
 | 'RatioAnalyst'
 | 'TrendAnalyst'
 | 'FraudAnalyst'
 | 'JournalEntryAnalyst'
 | 'RevenueRiskAnalyst'
 | 'ExpenseRiskAnalyst'
 | 'InventoryRiskAnalyst'
 | 'EvidenceReviewer'
 | 'WorkpaperReviewer'
 | 'FindingsAnalyst'
 | 'ReportWriter'
 | 'QualityReviewer'
 | 'DevilsAdvocate'
 | 'FinalChallenger'
 | 'ComplianceReviewer';

export interface AgentAssignment {
 role: ExtendedAgentRole;
 status: 'idle' | 'running' | 'completed';
}

export function createExtendedCouncil(): AgentAssignment[] {
 return [
  'EngagementManager','AuditPlanner','IFRSExpert','ISAExpert',
  'FinancialAnalyst','RatioAnalyst','TrendAnalyst','FraudAnalyst',
  'JournalEntryAnalyst','RevenueRiskAnalyst','ExpenseRiskAnalyst',
  'InventoryRiskAnalyst','EvidenceReviewer','WorkpaperReviewer',
  'FindingsAnalyst','ReportWriter','QualityReviewer',
  'DevilsAdvocate','FinalChallenger','ComplianceReviewer'
 ].map(role => ({ role, status: 'idle' }));
}
