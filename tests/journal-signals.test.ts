import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeJournalEntry } from '../packages/audit-engine/src/journal-signals.ts';

test('journal analysis emits deterministic indicators, not conclusions', () => {
  const entry = {
    id: 'JE-1',
    entryDate: '2026-12-31',
    debitMinor: 500000n,
    creditMinor: 0n,
    isManual: true,
    userName: 'rare-user',
  };
  const context = { periodEnd: '2026-12-31', lowFrequencyUsers: ['rare-user'] };
  const a = analyzeJournalEntry(entry, context);
  const b = analyzeJournalEntry(entry, context);
  assert.deepEqual(a, b);
  assert.equal(a.authority, 'indicator');
  assert.equal(a.engineVersion, 'SEE-JOURNAL-v1');
  assert.ok(a.signals.some((signal) => signal.code === 'MANUAL_ENTRY'));
  assert.ok(a.signals.some((signal) => signal.code === 'ROUNDED_AMOUNT'));
  assert.ok(a.signals.some((signal) => signal.code === 'PERIOD_END'));
  assert.ok(a.signals.some((signal) => signal.code === 'LOW_FREQUENCY_USER'));
});

test('weekend signal is only emitted when date metadata supports it', () => {
  const saturday = analyzeJournalEntry({ id:'JE-2', entryDate:'2026-09-05', debitMinor:100n, creditMinor:0n }, {});
  const missingDate = analyzeJournalEntry({ id:'JE-3', debitMinor:100n, creditMinor:0n }, {});
  assert.ok(saturday.signals.some((signal) => signal.code === 'WEEKEND_ENTRY'));
  assert.ok(!missingDate.signals.some((signal) => signal.code === 'WEEKEND_ENTRY'));
});
