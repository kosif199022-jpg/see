import test from 'node:test';
import assert from 'node:assert/strict';
import { STANDARDS_LIBRARY } from '../packages/audit-engine/src/standards.ts';

test('standards library exposes provenance and status for every card', () => {
  assert.ok(STANDARDS_LIBRARY.length >= 6);
  for (const standard of STANDARDS_LIBRARY) {
    assert.ok(standard.code);
    assert.ok(standard.titleAr);
    assert.ok(standard.sourceFamily);
    assert.ok(['current','adopted','transition','historical','training','local'].includes(standard.status));
    assert.ok(standard.version || standard.effectiveDate || standard.sourceNote);
    assert.equal(standard.authority, 'reference');
  }
});

test('Saudi/local references remain explicitly separated from IFRS source family', () => {
  const zakat = STANDARDS_LIBRARY.find((item) => item.code === 'SA-ZAKAT');
  assert.equal(zakat?.status, 'local');
  assert.notEqual(zakat?.sourceFamily, 'IFRS');
});
