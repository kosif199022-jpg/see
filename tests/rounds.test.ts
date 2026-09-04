import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIT_ROUNDS, validateRoundDecision } from '../packages/audit-engine/src/rounds.ts';

test('audit rounds preserve A01 through A10 professional order', () => {
  assert.deepEqual(AUDIT_ROUNDS.map((round) => round.code), ['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10']);
  assert.ok(AUDIT_ROUNDS.every((round) => round.gate.length > 10));
});

test('round completion requires a named human and rationale', () => {
  assert.equal(validateRoundDecision({ status:'complete', actorRole:'ai_agent', actor:'see-council', rationale:'done' }).allowed, false);
  assert.equal(validateRoundDecision({ status:'complete', actorRole:'manager', actor:'pilot-manager', rationale:'' }).allowed, false);
  assert.equal(validateRoundDecision({ status:'complete', actorRole:'manager', actor:'pilot-manager', rationale:'Gate evidence reviewed.' }).allowed, true);
});
