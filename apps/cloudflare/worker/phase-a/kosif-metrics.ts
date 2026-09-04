export type KosifCommandMetricInput = {
  journalFlagged: number;
  journalPendingReview: number;
  traceEvidence: number;
  traceLinkedEvidence: number;
  completedRounds: number;
  attentionRounds: number;
};

const count = (value: number) => Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0));

export function buildKosifCommandMetrics(input: KosifCommandMetricInput) {
  const journalFlagged = count(input.journalFlagged);
  const journalPendingReview = count(input.journalPendingReview);
  const evidence = count(input.traceEvidence);
  const linked = Math.min(evidence, count(input.traceLinkedEvidence));
  const completed = Math.min(10, count(input.completedRounds));
  const attention = Math.min(10, count(input.attentionRounds));

  return {
    journalFlagged,
    journalPendingReview,
    traceHealth: {
      evidence,
      linked,
      gaps: Math.max(0, evidence - linked),
    },
    roundsReady: {
      completed,
      attention,
      total: 10,
      ready: completed === 10 && attention === 0,
    },
  };
}
