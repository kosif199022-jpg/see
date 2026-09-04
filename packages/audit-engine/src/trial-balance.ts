export type TrialBalanceLine = {
  accountCode: string;
  accountName: string;
  debitMinor: bigint;
  creditMinor: bigint;
};

export function validateTrialBalance(lines: TrialBalanceLine[]) {
  const debit = lines.reduce((s,l)=>s+l.debitMinor,0n);
  const credit = lines.reduce((s,l)=>s+l.creditMinor,0n);
  return {
    balanced: debit === credit,
    debitMinor: debit,
    creditMinor: credit,
    differenceMinor: debit - credit
  };
}
