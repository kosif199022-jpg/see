import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticsSummary } from '../packages/audit-engine/src/analytics-summary.ts';

test('analytics summary labels outputs as indicators', () => {
  const result = buildAnalyticsSummary({
    totalDebit: 1_000_000n,
    totalCredit: 1_000_000n,
    accountCount: 10,
    highRiskCount: 2,
    mediumRiskCount: 3,
    openFindingCount: 1,
  });

  assert.equal(result.method, 'SEE-ANALYTICS-SUMMARY-v1');
  assert.equal(result.tbDifferenceMinor, 0n);
  assert.equal(result.authority, 'indicator');
  assert.equal(result.riskMix.high, 2);
  assert.equal(result.openFindingCount, 1);
});

test('analytics summary preserves exact TB difference as bigint', () => {
  const result = buildAnalyticsSummary({
    totalDebit: 1_000_005n,
    totalCredit: 1_000_000n,
    accountCount: 2,
    highRiskCount: 0,
    mediumRiskCount: 0,
    openFindingCount: 0,
  });

  assert.equal(result.tbDifferenceMinor, 5n);
  assert.equal(typeof result.tbDifferenceMinor, 'bigint');
});
