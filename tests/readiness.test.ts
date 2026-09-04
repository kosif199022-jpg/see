import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAuditReadiness } from '../packages/audit-engine/src/readiness.ts';

test('readiness exposes blocker codes instead of autonomous opinion', () => {
  const result = computeAuditReadiness({
    tbBalanced: true,
    unmappedAccounts: 0,
    unapprovedMateriality: 0,
    openHighRisks: 1,
    openPbc: 2,
    openReviewNotes: 0,
    openFindings: 0,
    evidenceCount: 3,
    reportApproved: false,
  });

  assert.equal(result.readyForArchive, false);
  assert.ok(result.blockers.some((item) => item.code === 'OPEN_HIGH_RISKS'));
  assert.ok(result.blockers.some((item) => item.code === 'PBC_INCOMPLETE'));
  assert.equal(result.method, 'SEE-READINESS-v1');
  assert.doesNotMatch(result.label, /unmodified opinion/i);
});

test('readiness never becomes archive-ready before report approval', () => {
  const result = computeAuditReadiness({
    tbBalanced: true,
    unmappedAccounts: 0,
    unapprovedMateriality: 0,
    openHighRisks: 0,
    openPbc: 0,
    openReviewNotes: 0,
    openFindings: 0,
    evidenceCount: 2,
    reportApproved: false,
  });

  assert.equal(result.label, 'ready_for_human_review');
  assert.equal(result.readyForArchive, false);
  assert.ok(result.blockers.some((item) => item.code === 'REPORT_NOT_APPROVED'));
});
