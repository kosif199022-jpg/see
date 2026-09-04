export type MappingStatus = 'unmapped' | 'suggested' | 'approved';

export interface AccountMapping {
  accountId: string;
  accountName: string;
  statementLine?: string;
  standardRef?: string;
  status: MappingStatus;
  confidence?: number;
}

export function approveMapping(mapping: AccountMapping): AccountMapping {
  return { ...mapping, status: 'approved' };
}
