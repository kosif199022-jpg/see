export type ImportRow = {
  accountCode: string;
  accountName: string;
  debit: bigint;
  credit: bigint;
};

export type ImportResult = {
  rows: ImportRow[];
  errors: string[];
  balanced: boolean;
};

export function validateImport(rows: ImportRow[]): ImportResult {
  const errors: string[] = [];
  const debit = rows.reduce((s, r) => s + r.debit, 0n);
  const credit = rows.reduce((s, r) => s + r.credit, 0n);
  if (debit !== credit) errors.push('TRIAL_BALANCE_NOT_BALANCED');
  return { rows, errors, balanced: errors.length === 0 };
}
