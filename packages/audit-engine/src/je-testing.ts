export type JournalEntry = {
  id: string;
  amountMinor: bigint;
  user: string;
  date: string;
};

export function runJournalTests(entries: JournalEntry[]) {
  return entries.map((entry) => ({
    entryId: entry.id,
    flags: [
      ...(entry.amountMinor < 0n ? ["NEGATIVE_AMOUNT"] : []),
      ...(entry.date.includes("12-31") ? ["PERIOD_END_REVIEW"] : []),
    ],
  }));
}
