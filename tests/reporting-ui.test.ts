import test from 'node:test';
import assert from 'node:assert/strict';
import { canRequestReportApproval } from '../apps/cloudflare/src/reporting-readiness.ts';

test('report approval is enabled when REPORT_NOT_APPROVED is the only blocker', () => {
  assert.equal(canRequestReportApproval([
    { code: 'REPORT_NOT_APPROVED', message: 'Final report still requires human approval.' },
  ]), true);
});

test('report approval remains blocked by professional blockers', () => {
  assert.equal(canRequestReportApproval([
    { code: 'OPEN_REVIEW_NOTES', message: 'Review notes remain open.', count: 1 },
    { code: 'REPORT_NOT_APPROVED', message: 'Final report still requires human approval.' },
  ]), false);
});
