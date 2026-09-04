import { useEffect, useState } from 'react';
import { phaseAApi } from '../api';
import type { AuditRound, CommandCenter, Perform } from '../types';
import { Badge, SectionHead } from './Status';

const STATUS_LABELS: Record<string, string> = {
  not_started: 'لم تبدأ',
  in_progress: 'قيد التنفيذ',
  attention: 'تحتاج انتباه',
  complete: 'مكتملة',
};

export function RoundsWorkspace({ engagementId, commandCenter, perform, refresh, busy }: {
  engagementId: string;
  commandCenter: CommandCenter;
  perform: Perform;
  refresh: () => Promise<void>;
  busy: boolean;
}) {
  const [rounds, setRounds] = useState<AuditRound[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const result = await phaseAApi.rounds(engagementId);
      setRounds(result.rounds);
    } finally { setLoading(false); }
  }

  useEffect(() => { reload().catch(() => undefined); }, [engagementId]);

  async function update(round: AuditRound, status: 'in_progress' | 'attention' | 'complete') {
    const rationale = prompt(status === 'complete' ? 'أدخل مبرر إكمال الجولة' : 'أدخل ملاحظة القرار المهني (اختياري للحالات غير المكتملة)') ?? '';
    if (status === 'complete' && !rationale.trim()) return;
    await perform(async () => {
      await phaseAApi.updateRound(engagementId, {
        roundCode: round.code,
        status,
        rationale: rationale.trim(),
        actor: 'pilot-manager',
        actorRole: 'manager',
      });
      await Promise.all([reload(), refresh()]);
    }, `تم تسجيل قرار بشري للجولة ${round.code}.`);
  }

  return <div className="workspace-view professional-workspace rounds-workspace">
    <div className="workspace-title"><div><Badge tone="ai">A01 → A10</Badge><h1>الجولات المهنية العشر</h1><p>كل جولة قرار مهني مستقل بإصدار جديد؛ الإكمال لا يحدث تلقائيًا ولا يستطيع AI اعتماده.</p></div><div className="engagement-state"><small>مكتمل</small><strong>{commandCenter.metrics.roundsReady.completed}/10</strong></div></div>

    <section className="panel-glass"><SectionHead title="حالة الجولات" subtitle={commandCenter.metrics.roundsReady.ready ? 'الجولات العشر مكتملة بلا حالات انتباه.' : `${commandCenter.metrics.roundsReady.attention} تحتاج انتباه · ${10 - commandCenter.metrics.roundsReady.completed} غير مكتملة`}/>{loading && <p className="muted">تحميل القرارات…</p>}<div className="rounds-grid">{rounds.map((round) => {
      const status = round.decision?.status ?? 'not_started';
      return <article className={`round-card ${status}`} key={round.code}>
        <div className="round-code">{round.code}</div>
        <div className="round-copy"><Badge tone={status === 'complete' ? 'ok' : status === 'attention' ? 'warn' : 'neutral'}>{STATUS_LABELS[status] ?? status}</Badge><h3>{round.title}</h3><p>{round.gate}</p>{round.decision && <small>v{String(round.decision.version)} · {String(round.decision.actor ?? '')}{round.decision.rationale ? ` · ${String(round.decision.rationale)}` : ''}</small>}</div>
        <div className="round-actions"><button disabled={busy} className="small-action ghost" onClick={() => update(round, 'in_progress')}>بدء/استمرار</button><button disabled={busy} className="small-action" onClick={() => update(round, 'attention')}>يحتاج انتباه</button><button disabled={busy} className="small-action" onClick={() => update(round, 'complete')}>إكمال بشري</button></div>
      </article>;
    })}{!loading && rounds.length === 0 && <p className="muted">لا توجد بيانات جولات.</p>}</div></section>
  </div>;
}
