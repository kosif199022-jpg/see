export interface StatementLine {
  code:string;
  name:string;
  amount:bigint;
  sourceAccounts:string[];
}

export interface FinancialStatement {
  type:'BS'|'IS';
  lines:StatementLine[];
}

export function total(statement:FinancialStatement):bigint {
 return statement.lines.reduce((a,l)=>a+l.amount,0n);
}
