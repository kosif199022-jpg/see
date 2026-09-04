export interface StatementLine {
  label:string;
  amount:bigint;
  sourceAccounts:string[];
}

export interface FinancialStatementView {
  type:'balance_sheet'|'income_statement';
  lines:StatementLine[];
}
