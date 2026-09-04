import { useEffect, useState } from 'react';
import { phaseAApi } from '../api';
import { reviewNoteClearInput, reviewNotesForDisplay, type ReviewNoteDisplay } from '../review-notes';
import type { Perform } from '../types';
import { Badge, SectionHead } from './Status';

export function ReviewNotesPanel({ engagementId, perform, busy, onChanged }: {
  engagementId: string;
  perform: Perform;
  busy: boolean;
  onChanged: () => Promise<void>;
}) {
  const [notes, setNotes] = useState<ReviewNoteDisplay[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const result = await phaseAApi.reviewNotes(engagementId);
      setNotes(reviewNotesForDisplay(result.notes));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, [engagementId]);

  async function clear(id: string) {
    await perform(async () => {
      await phaseAApi.clearReviewNote(id, reviewNoteClearInput('pilot-manager'));
      await Promise.all([reload(), onChanged()]);
    }, 'تم مسح ملاحظة المراجعة بقرار مراجع بشري مسمى.');
  }

  return <section className="panel-glass review-note-panel" aria-labelledby="open-review-notes-title">
    <SectionHead title="ملاحظات المراجعة المفتوحة" subtitle="لا تُمسح تلقائيًا عند تقدم ورقة العمل؛ القرار البشري مسجل في سجل المراجعة."/>
    <div id="open-review-notes-title" className="review-note-summary">
      <Badge tone={notes.length ? 'warn' : 'ok'}>{notes.length ? `${notes.length} مفتوحة` : 'لا توجد ملاحظات مفتوحة'}</Badge>
      {loading && <span className="muted">تحديث…</span>}
    </div>
    <div className="card-list">
      {notes.map((item) => <article className="list-card review-note-card" key={item.id}>
        <div>
          <Badge tone="warn">OPEN REVIEW NOTE</Badge>
          <strong>{item.workpaperTitle}</strong>
          <p>{item.note}</p>
          <small>فتحها {item.createdBy}{item.createdAt ? ` · ${item.createdAt}` : ''}</small>
        </div>
        <button className="small-action" disabled={busy} onClick={() => clear(item.id)}>مسح كمراجع بشري</button>
      </article>)}
      {!loading && notes.length === 0 && <p className="muted">لا توجد ملاحظات مراجعة تمنع الجاهزية حاليًا.</p>}
    </div>
  </section>;
}
