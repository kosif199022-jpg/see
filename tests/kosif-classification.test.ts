import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAccount } from '../packages/audit-engine/src/classification.ts';

test('classifies cash and bank accounts with standards and assertions', () => {
  const result = classifyAccount({ code: '1101', name: 'البنك الرئيسي', debitMinor: 10000n, creditMinor: 0n });
  assert.equal(result.category, 'cash_and_banks');
  assert.ok(result.standards.includes('IAS 7'));
  assert.ok(result.assertions.includes('الوجود'));
  assert.equal(result.authority, 'indicator');
});

test('classification is deterministic for the same account', () => {
  const input = { code: '4100', name: 'إيرادات المبيعات', debitMinor: 0n, creditMinor: 250000n };
  assert.deepEqual(classifyAccount(input), classifyAccount(input));
});
