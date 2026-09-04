import test from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_MODULES, MOBILE_GROUPS } from '../apps/cloudflare/src/navigation.ts';

test('desktop exposes all KOSIF-derived professional modules', () => {
  assert.equal(DESKTOP_MODULES.length, 13);
  assert.deepEqual(DESKTOP_MODULES.map((item) => item.id), [
    'command-center',
    'data',
    'planning',
    'risks',
    'journal',
    'workpapers',
    'pbc',
    'evidence',
    'standards',
    'rounds',
    'council',
    'reports',
    'knowledge',
  ]);
});

test('mobile keeps five grouped destinations with complete module reachability', () => {
  assert.deepEqual(MOBILE_GROUPS.map((item) => item.id), ['home', 'audit', 'analytics', 'council', 'more']);
  assert.ok(DESKTOP_MODULES.every((module) => MOBILE_GROUPS.some((group) => group.modules.includes(module.id))));
});
