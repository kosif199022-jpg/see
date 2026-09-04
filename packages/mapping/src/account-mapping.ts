export type AccountMapping = {
  accountCode: string;
  statementLine: string;
  standardReference?: string;
  reviewed: boolean;
};

export function suggestMapping(accountCode: string): AccountMapping {
  return {
    accountCode,
    statementLine: 'UNMAPPED',
    reviewed: false
  };
}
