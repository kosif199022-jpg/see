import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewNotesForDisplay, reviewNoteClearInput } from '../apps/cloudflare/src/review-notes.ts';

test('review notes UI surfaces only open notes with workpaper context', () => {
  const result = reviewNotesForDisplay([
    {
      id: 'note-cleared',
      note: 'Already resolved',
      status: 'cleared',
      workpaper_id: 'wp-1',
      workpaper_title: 'Revenue cut-off',
      created_by: 'manager-a',
      created_at: '2026-09-04T10:00:00Z',
    },
    {
      id: 'note-open',
      note: 'Corroborate cut-off evidence',
      status: 'open',
      workpaper_id: 'wp-2',
      workpaper_title: 'Revenue testing',
      created_by: 'manager-b',
      created_at: '2026-09-04T11:00:00Z',
    },
  ] as any);

  assert.deepEqual(result, [{
    id: 'note-open',
    note: 'Corroborate cut-off evidence',
    workpaperId: 'wp-2',
    workpaperTitle: 'Revenue testing',
    createdBy: 'manager-b',
    createdAt: '2026-09-04T11:00:00Z',
  }]);
});

test('review note clearance payload is explicitly human and named', () => {
  assert.deepEqual(reviewNoteClearInput('pilot-manager'), {
    actor: 'pilot-manager',
    actorRole: 'manager',
  });
  assert.throws(() => reviewNoteClearInput('   '), /reviewer/i);
});
