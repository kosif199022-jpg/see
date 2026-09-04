import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTrialBalance,
  calculateMateriality,
  scoreRisk,
  summarizeAudit,
} from '../packages/audit-engine/src/cloudflare-core.ts';

test('validates a balanced trial balance and preserves total debits/credits', () => {
  const result = validateTrialBalance([
    { account: 'Cash', debit: 100000n, credit: 0n },
    { account: 'Revenue', debit: 0n, credit: 100000n },
  ]);
  assert.equal(result.balanced, true);
  assert.equal(result.totalDebit, 100000n);
  assert.equal(result.totalCredit, 100000n);
  assert.deepEqual(result.errors, []);
});

test('rejects unbalanced trial balance lines', () => {
  const result = validateTrialBalance([
    { account: 'Cash', debit: 100000n, credit: 0n },
    { account: 'Revenue', debit: 0n, credit: 90000n },
  ]);
  assert.equal(result.balanced, false);
  assert.ok(result.errors.some((error) => error.includes('does not balance')));
});

test('calculates deterministic materiality in minor units', () => {
  const result = calculateMateriality({ benchmark: 10_000_000n, percentageBasisPoints: 500 });
  assert.equal(result.amount, 500_000n);
  assert.equal(result.version, 'SEE-MATERIALITY-v2');
});

test('scores risk deterministically and requires rationale', () => {
  const result = scoreRisk({ likelihood: 4, magnitude: 5, controlReliance: 2, rationale: 'Revenue recognition complexity' });
  assert.equal(result.score, 90);
  assert.equal(result.level, 'high');
  assert.equal(result.version, 'SEE-RISK-v1');
});

test('audit summary never claims an autonomous statutory opinion', () => {
  const summary = summarizeAudit({
    engagementName: 'Demo Co',
    unapprovedMappings: 1,
    openHighRisks: 2,
    unresolvedFindings: 1,
    evidenceCount: 4,
  });
  assert.equal(summary.readyForHumanSignoff, false);
  assert.match(summary.status, /Human sign-off required/);
  assert.doesNotMatch(summary.status, /unmodified opinion/i);
});
