import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { phaseAApi } from '../api';
import type { CouncilRun, LegacyDashboard, Perform } from '../types';
import { Badge, EmptyState, SectionHead } from './Status';

const NEXT: Record<string, string> = {
  prepared: 'running',
  running: 'challenged',
  challenged: 'synthesized',
  synthesized: 'human_reviewed',
};

export function CouncilWorkspace({ engagementId, legacy, perform }: {
  engagementId: string;
  legacy: LegacyDashboard;
  perform: Perform;
}) {
  const [runs, setRuns] = useState<CouncilRun[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try { setRuns((await phaseAApi.councilRuns(engagementId)).runs); }
    finally { setLoading(false); }
  }
  useEffect(() => { setSelectedEvidence([]); reload().catch(() => undefined); }, [engagementId]);

  const evidenceById = useMemo(() => new Map(legacy.evidence.map((row) => [String(row.id), row])), [legacy.evidence]);

  async function createRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform(async () => {
      await phaseAApi.createCouncilRun(engagementId, {
        task: form.get('task'),
        evidenceIds: selectedEvidence,
        createdBy: 'pilot-manager',
      });
      event.currentTarget.reset(); setSelectedEvidence([]); await reload();
    }, 'تم إعداد جلسة مجلس استشارية من لقطة أدلة محددة.');
  }

  async function advance(run: CouncilRun) {
    const to = NEXT[run.status]; if (!to) return;
    if (to === 'human_reviewed') {
      const humanDecision = window.prompt('قرار المراجع البشري');
      if (!humanDecision?.trim()) return;
      const humanRationale = window.prompt('مبرر القرار البشري');
      if (!humanRationale?.trim()) return;
      await perform(async () => {
        await phaseAApi.transitionCouncil(run.id, {
          to,
          actorRole: 'manager',
          actor: 'pilot-manager',
          humanDecision: humanDecision.trim(),
          humanRationale: humanRationale.trim(),
        });
        await reload();
      }, 'تم تسجيل المراجعة البشرية للمجلس.');
      return;
    }
    await perform(async () => {
      await phaseAApi.transitionCouncil(run.id, {
        to,
        actorRole: 'ai_agent',
        actor: 'see-council-shell',
        ...(to === 'synthesized' ? { synthesis: { summary: 'Phase A governance shell only; no external model call was made.', authority: 'advisory' } } : {}),
      });
      await reload();
    }, `تم تحديث جلسة المجلس إلى ${to}.`);
  }

  function toggleEvidence(id: string) {
    setSelectedEvidence((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <div className="workspace-view council-workspace">
    <div className="workspace-title"><div><Badge tone="ai">GOVERNED AI</Badge><h1>مجلس AI</h1><p>المجلس استشاري ولا يملك صلاحية الاعتماد أو إصدار رأي أو ترحيل قيد.</p></div><div className="method-card"><span>السلطة</span><strong>Advisory only</strong><small>Human decision required</small></div></div>

    <div className="governance-banner"><span>◇</span><div><strong>حدود السلطة المهنية</strong><p>Phase A لا يستدعي مزود AI خارجيًا. الجلسة تحفظ المهمة ولقطة الأدلة وحالات المراجعة فقط، وأي قرار مهني نهائي يبقى بشريًا.</p></div></div>

    <section className="two-column council-layout">
      <div className="panel-glass">
        <SectionHead title="إعداد جلسة" subtitle="اختر أدلة محددة؛ لا يتم نسخ محتوى الملفات إلى سجل المجلس"/>
        <form className="form-stack" onSubmit={createRun}>
          <label>المهمة<textarea name="task" placeholder="مثال: تحدَّ افتراضات استجابة مخاطر الاعتراف بالإيراد" required/></label>
          <fieldset className="evidence-picker"><legend>لقطة الأدلة</legend>{legacy.evidence.length ? legacy.evidence.map((row) => { const id = String(row.id); return <label className={selectedEvidence.includes(id) ? 'selected' : ''} key={id}><input type="checkbox" checked={selectedEvidence.includes(id)} onChange={() => toggleEvidence(id)}/><span><strong>{String(row.name ?? id)}</strong><small>{String(row.status ?? 'registered')} · {String(row.sha256 ?? '').slice(0, 12)}…</small></span></label>; }) : <p className="muted">ارفع دليلًا أولًا قبل إنشاء جلسة.</p>}</fieldset>
          <button disabled={loading || selectedEvidence.length === 0}>إعداد الجلسة</button>
        </form>
      </div>

      <div className="panel-glass">
        <SectionHead title="حالات المجلس" subtitle="prepared → running → challenged → synthesized → human_reviewed"/>
        <div className="council-state-line">{['prepared','running','challenged','synthesized','human_reviewed'].map((state, index) => <div key={state}><span>{index + 1}</span><b>{state}</b></div>)}</div>
        <p className="indicator-note">الانتقال إلى human_reviewed يطلب قرارًا ومبررًا من مراجع بشري مصرح له.</p>
      </div>
    </section>

    <section className="panel-glass"><SectionHead title="الجلسات المسجلة" subtitle="Metadata snapshot + append-only events"/>{loading ? <div className="loading-line">تحميل الجلسات…</div> : runs.length ? <div className="card-list council-run-list">{runs.map((run) => <CouncilCard key={run.id} run={run} evidenceById={evidenceById} onAdvance={() => advance(run)}/>)}</div> : <EmptyState title="لا توجد جلسة بعد">ابدأ جلسة من أدلة محددة، ثم مرّرها عبر حالات الحوكمة.</EmptyState>}</section>
  </div>;
}

function CouncilCard({ run, evidenceById, onAdvance }: { run: CouncilRun; evidenceById: Map<string, Record<string, any>>; onAdvance: () => void }) {
  let snapshot: Array<Record<string, any>> = [];
  try { snapshot = JSON.parse(String(run.evidence_snapshot_json ?? '[]')); } catch { snapshot = []; }
  const next = NEXT[run.status];
  return <article className="list-card council-run-card"><div className="council-run-main"><div className="eyebrow-row"><Badge tone={run.status === 'human_reviewed' ? 'ok' : 'ai'}>{run.status}</Badge><small>{String(run.created_at ?? '').slice(0, 16).replace('T', ' ')}</small></div><strong>{run.task}</strong><div className="snapshot-chips">{snapshot.map((item) => <span key={String(item.id)} title={String(evidenceById.get(String(item.id))?.name ?? item.name)}>{String(item.name ?? item.id)}</span>)}</div>{run.human_decision && <div className="human-decision"><b>قرار بشري</b><span>{String(run.human_decision)}</span><small>{String(run.human_rationale ?? '')}</small></div>}</div>{next ? <button className="ghost-action" onClick={onAdvance}>{next === 'human_reviewed' ? 'مراجعة بشرية' : `انتقال إلى ${next}`}</button> : <Badge tone="ok">مكتملة الحوكمة</Badge>}</article>;
}
