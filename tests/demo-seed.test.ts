import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhaseADemoSeed } from '../apps/cloudflare/worker/phase-a/demo-seed.ts';

test('Phase A demo seed demonstrates governed workflow without an approved report', () => {
  const seed = buildPhaseADemoSeed({
    engagementId: 'eng-1',
    riskId: 'risk-1',
    evidenceId: 'evidence-1',
    createdAt: '2026-09-04T00:00:00.000Z',
  });

  assert.equal(seed.pbc.status, 'received');
  assert.equal(seed.pbc.evidenceId, 'evidence-1');
  assert.equal(seed.procedure.riskId, 'risk-1');
  assert.equal(seed.procedureRun.status, 'completed');
  assert.equal(seed.workpaper.status, 'draft');
  assert.equal(seed.workpaperVersion.status, 'draft');
  assert.equal(seed.reviewNote.status, 'open');
  assert.equal(seed.evidenceLink.targetType, 'procedure');
  assert.equal(seed.councilRun.status, 'prepared');
  assert.equal(seed.journalRun.flaggedEntries, 1);
  assert.equal(seed.journalReviewItem.status, 'pending');
  assert.equal(seed.journalReviewItem.signalCode, 'MANUAL_ENTRY');
  assert.ok(seed.roundDecisions.some((round) => round.status === 'attention'));
  assert.ok(seed.roundDecisions.length < 10, 'demo must not imply all ten rounds are complete');
  assert.equal(seed.standardUsage.standardCode, 'IFRS 18');
  assert.equal(seed.standardUsage.targetType, 'procedure');
  assert.deepEqual(seed.reportVersions, []);
});
