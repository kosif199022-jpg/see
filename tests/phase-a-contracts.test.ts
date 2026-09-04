import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_WORKSPACES, AUDIT_STAGES, TRACE_TARGETS } from '../apps/cloudflare/worker/phase-a/types.ts';

test('Phase A exposes five primary workspaces', () => {
  assert.deepEqual(PRIMARY_WORKSPACES, ['home', 'audit', 'analytics', 'council', 'more']);
});

test('audit stages preserve professional order', () => {
  assert.deepEqual(AUDIT_STAGES.slice(0, 4), ['acceptance', 'planning', 'pbc', 'data_intake']);
  assert.equal(AUDIT_STAGES.at(-1), 'archive');
});

test('trace graph accepts governed target types only', () => {
  assert.ok(TRACE_TARGETS.includes('procedure'));
  assert.ok(TRACE_TARGETS.includes('workpaper'));
  assert.equal(TRACE_TARGETS.includes('final_opinion' as never), false);
});
