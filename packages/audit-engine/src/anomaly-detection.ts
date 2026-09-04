export type Anomaly = {
  accountId: string;
  reason: string;
  score: number;
};

export function detectAnomalies(entries: any[]): Anomaly[] {
  return entries.filter(Boolean).map((e, i) => ({
    accountId: e.id ?? String(i),
    reason: "review required",
    score: 0.5
  }));
}
