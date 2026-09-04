import test from 'node:test';
import assert from 'node:assert/strict';
import { selectSample } from '../packages/audit-engine/src/sampling.ts';

test('random sample is reproducible for a fixed seed', () => {
  const input = { populationIds: ['1','2','3','4','5'], method: 'random' as const, size: 3, seed: 380019 };
  const a = selectSample(input);
  const b = selectSample(input);
  assert.deepEqual(a.selectedIds, b.selectedIds);
  assert.equal(a.engineVersion, 'SEE-KOSIF-SAMPLING-v1');
  assert.equal(new Set(a.selectedIds).size, 3);
});

test('systematic sample returns requested unique population ids', () => {
  const result = selectSample({ populationIds: ['a','b','c','d','e','f'], method: 'systematic', size: 3, seed: 7 });
  assert.equal(result.selectedIds.length, 3);
  assert.ok(result.selectedIds.every((id) => ['a','b','c','d','e','f'].includes(id)));
});
