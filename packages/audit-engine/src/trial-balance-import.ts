export interface TrialBalanceRow { code:string; name:string; balance:bigint }

export function importTrialBalance(rows: TrialBalanceRow[]) {
  return { count: rows.length, rows };
}
