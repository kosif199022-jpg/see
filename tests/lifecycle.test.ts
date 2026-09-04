import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEngagementTransition,
  validatePbcTransition,
  validateWorkpaperTransition,
  validateCouncilTransition,
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
