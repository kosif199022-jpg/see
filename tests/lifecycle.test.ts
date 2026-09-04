import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEngagementTransition,
  validatePbcTransition,
  validateWorkpaperTransition,
  validateCouncilTransition,
  validateRiskClosure,
} from '../packages/domain/src/lifecycle.ts';

test('engagement cannot skip acceptance and planning', () => {
  const result = validateEngagementTransition('draft', 'fieldwork', {
    actorRole: 'manager', prerequisites: [],
  });
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('ENGAGEMENT_INVALID_TRANSITION'));
});

test('archive requires partner role and all closure prerequisites', () => {
  const denied = validateEngagementTransition('reporting', 'archived', {
    actorRole: 'manager', prerequisites: ['REPORT_APPROVED', 'EVIDENCE_SUFFICIENT'],
  });
  assert.equal(denied.allowed, false);
  assert.ok(denied.blockers.includes('ARCHIVE_PARTNER_REQUIRED'));
});

test('PBC receipt does not equal evidence acceptance', () => {
  assert.equal(validatePbcTransition('requested', 'received').allowed, true);
  assert.equal(validatePbcTransition('received', 'accepted').allowed, false);
  assert.equal(validatePbcTransition('received', 'under_review').allowed, true);
});

test('signed workpaper edit must open a new version instead of mutation', () => {
  const result = validateWorkpaperTransition('approved', 'draft', { actorRole: 'senior' });
  assert.equal(result.allowed, false);
  assert.equal(result.requiresNewVersion, true);
});

test('Council cannot mark itself human reviewed without human actor', () => {
  const result = validateCouncilTransition('synthesized', 'human_reviewed', { actorRole: 'ai_agent' });
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('HUMAN_REVIEW_REQUIRED'));
});

test('high-risk closure requires an authorized human and rationale', () => {
  const ai = validateRiskClosure({ actorRole: 'ai_agent', rationale: 'AI proposes closure' });
  assert.equal(ai.allowed, false);
  assert.ok(ai.blockers.includes('RISK_CLOSURE_HUMAN_REQUIRED'));

  const noRationale = validateRiskClosure({ actorRole: 'manager', rationale: '   ' });
  assert.equal(noRationale.allowed, false);
  assert.ok(noRationale.blockers.includes('RISK_CLOSURE_RATIONALE_REQUIRED'));

  const manager = validateRiskClosure({ actorRole: 'manager', rationale: 'Procedure completed and reviewed.' });
  assert.equal(manager.allowed, true);
});
