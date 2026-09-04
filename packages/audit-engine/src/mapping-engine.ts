export interface MappingSuggestion {
  account: string;
  statementLine: string;
  confidence: number;
}

export function suggestMapping(account:string): MappingSuggestion {
  return { account, statementLine:'Unmapped', confidence:0 };
}
