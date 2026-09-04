import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKosifCommandMetrics } from '../apps/cloudflare/worker/phase-a/kosif-metrics.ts';

test('KOSIF command metrics remain server-derived and distinguish pending journal review', () => {
  const result = buildKosifCommandMetrics({
    journalFlagged: 7,
    journalPendingReview: 3,
    traceEvidence: 5,
    traceLinkedEvidence: 4,
    completedRounds: 6,
    attentionRounds: 1,
  });

  assert.deepEqual(result, {
    journalFlagged: 7,
    journalPendingReview: 3,
    traceHealth: { evidence: 5, linked: 4, gaps: 1 },
    roundsReady: { completed: 6, attention: 1, total: 10, ready: false },
  });
});

test('round readiness requires all ten rounds complete with no attention state', () => {
  const result = buildKosifCommandMetrics({
    journalFlagged: 0,
    journalPendingReview: 0,
    traceEvidence: 2,
    traceLinkedEvidence: 2,
    completedRounds: 10,
    attentionRounds: 0,
  });
  assert.equal(result.roundsReady.ready, true);
  assert.equal(result.traceHealth.gaps, 0);
});
