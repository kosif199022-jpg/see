import type { ReviewNote } from './types';

export type ReviewNoteDisplay = {
  id: string;
  note: string;
  workpaperId: string | null;
  workpaperTitle: string;
  createdBy: string;
  createdAt: string;
};

export function reviewNotesForDisplay(notes: ReviewNote[]): ReviewNoteDisplay[] {
  return notes
    .filter((item) => item.status === 'open')
    .map((item) => ({
      id: item.id,
      note: item.note,
      workpaperId: item.workpaper_id ?? null,
      workpaperTitle: item.workpaper_title ?? 'ورقة عمل غير محددة',
      createdBy: item.created_by,
      createdAt: String(item.created_at ?? ''),
    }));
}

export function reviewNoteClearInput(actor: string) {
  const reviewer = actor.trim();
  if (!reviewer) throw new Error('Named reviewer is required');
  return { actor: reviewer, actorRole: 'manager' as const };
}
