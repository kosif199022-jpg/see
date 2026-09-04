export type FsLine = {
  id: string;
  name: string;
  amountMinor: bigint;
  sourceAccounts: string[];
};

export function buildFinancialStatement(lines: FsLine[]) {
  return {
    lines,
    totalMinor: lines.reduce((sum, line) => sum + line.amountMinor, 0n),
    traceable: lines.every((line) => line.sourceAccounts.length > 0),
  };
}
