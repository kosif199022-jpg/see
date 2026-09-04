import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultModuleForWorkspace, workspaceForDesktopModule } from '../apps/cloudflare/src/navigation.ts';

test('each five-workspace destination has a deterministic professional module default', () => {
  assert.equal(defaultModuleForWorkspace('home'), 'command-center');
  assert.equal(defaultModuleForWorkspace('audit'), 'data');
  assert.equal(defaultModuleForWorkspace('analytics'), 'journal');
  assert.equal(defaultModuleForWorkspace('council'), 'council');
  assert.equal(defaultModuleForWorkspace('more'), 'evidence');
});

test('specific professional module preserves its group without collapsing its identity', () => {
  assert.equal(workspaceForDesktopModule('standards'), 'more');
  assert.equal(workspaceForDesktopModule('rounds'), 'audit');
  assert.equal(workspaceForDesktopModule('journal'), 'analytics');
});
