import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyMinor } from '../packages/audit-engine/src/money.ts';
import { normalizeAuditText } from '../packages/audit-engine/src/text-normalization.ts';

test('parses Arabic and Western money directly to minor units', () => {
  assert.equal(parseMoneyMinor('١٬٢٣٤٫٥٠'), 123450n);
  assert.equal(parseMoneyMinor('(1,250.25)'), -125025n);
  assert.equal(parseMoneyMinor('1,250'), 125000n);
  assert.equal(parseMoneyMinor('1250,25'), 125025n);
});

test('normalizes Arabic digits and audit text deterministically', () => {
  assert.equal(normalizeAuditText('  إيرادات ٢٠٢٦  '), 'ايرادات 2026');
  assert.equal(normalizeAuditText('ذِمَم مَدينة'), 'ذمم مدينه');
});
