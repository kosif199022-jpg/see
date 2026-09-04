import { useEffect, useState, type FormEvent } from 'react';
import { phaseAApi } from '../api';
import type { CommandCenter, JournalReviewItem, JournalReviewRun, Perform, SamplingRun } from '../types';
import { Badge, SectionHead } from './Status';

function formatMinor(value: number | string) {
  const minor = BigInt(String(value ?? 0));
  const sign = minor < 0n ? '-' : '';
  const absolute = minor < 0n ? -minor : minor;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, '0');
  return `${sign}${new Intl.NumberFormat('ar-SA').format(whole)}٫${fraction}`;
}

export function JournalWorkspace({ engagementId, commandCenter, perform, refresh, busy }: {
  engagementId: string;
  commandCenter: CommandCenter;
  perform: Perform;
  refresh: () => Promise<void>;
  busy: boolean;
}) {
  const [run, setRun] = useState<JournalReviewRun | null>(null);
  const [items, setItems] = useState<JournalReviewItem[]>([]);
  const [samplingRuns, setSamplingRuns] = useState<SamplingRun[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const [journal, samples] = await Promise.all([
        phaseAApi.journalReview(engagementId),
        phaseAApi.samplingRuns(engagementId),
      ]);
      setRun(journal.run);
      setItems(journal.items);
      setSamplingRuns(samples.runs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload().catch(() => undefined); }, [engagementId]);

  async function createJournalReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const debit = String(form.get('debit') ?? '0');
    const credit = String(form.get('credit') ?? '0');
    await perform(async () => {
      await phaseAApi.createJournalReview(engagementId, {
        actor: 'pilot-senior',
        sourceVersion: String(form.get('sourceVersion') || new Date().toISOString()),
        entries: [{
          entryNumber: String(form.get('entryNumber') ?? '').trim(),
          lineNumber: 1,
          entryDate: String(form.get('entryDate') ?? ''),
          accountCode: String(form.get('accountCode') ?? '').trim(),
          accountName: String(form.get('accountName') ?? '').trim(),
          debitMinor: debit,
          creditMinor: credit,
          description: String(form.get('description') ?? '').trim(),
          userName: String(form.get('userName') ?? '').trim(),
          isManual: form.get('isManual') === 'on',
        }],
      });
      event.currentTarget.reset();
      await Promise.all([reload(), refresh()]);
    }, 'تم تشغيل فحص القيود الحتمي. الإشارات تحتاج قرار مراجع بشري.');
  }

  async function decide(item: JournalReviewItem, disposition: 'cleared' | 'exception') {
    const rationale = prompt(disposition === 'cleared' ? 'اكتب مبرر إقفال الإشارة' : 'اكتب سبب اعتبارها استثناءً يحتاج متابعة');
    if (!rationale?.trim()) return;
    await perform(async () => {
      await phaseAApi.reviewJournalItem(item.id, {
        disposition,
        rationale: rationale.trim(),
        actor: 'pilot-manager',
        actorRole: 'manager',
      });
      await Promise.all([reload(), refresh()]);
    }, 'تم تسجيل قرار المراجع البشري على إشارة القيد.');
  }

  async function createSample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const populationIds = String(form.get('populationIds') ?? '').split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
    await perform(async () => {
      await phaseAApi.createSamplingRun(engagementId, {
        populationIds,
        method: String(form.get('method') ?? 'random'),
        size: Number(form.get('size')),
        seed: Number(form.get('seed')),
        actor: 'pilot-senior',
        populationSource: String(form.get('populationSource') ?? 'journal-population').trim(),
      });
      await reload();
    }, 'تم حفظ عينة قابلة لإعادة التنفيذ بنفس seed.');
  }

  const pending = items.filter((item) => item.status === 'pending');

  return <div className="workspace-view professional-workspace journal-workspace">
    <div className="workspace-title"><div><Badge tone="ai">KOSIF DETERMINISTIC</Badge><h1>فحص قيود اليومية</h1><p>الإشارات الحتمية تساعد المراجع على التركيز؛ لا تُعامل أي إشارة كنتيجة أو احتيال مثبت.</p></div><div className="engagement-state"><small>بانتظار المراجع</small><strong>{commandCenter.metrics.journalPendingReview}</strong></div></div>

    <section className="metric-grid compact-metrics">
      <Metric label="إشارات آخر تشغيل" value={commandCenter.metrics.journalFlagged}/>
      <Metric label="قرارات معلقة" value={commandCenter.metrics.journalPendingReview}/>
      <Metric label="نسخة المحرك" value={run?.engine_version ?? '—'}/>
      <Metric label="إجمالي القيود المفحوصة" value={run?.total_entries ?? 0}/>
    </section>

    <div className="two-column professional-grid">
      <section className="panel-glass"><SectionHead title="تشغيل فحص قيد" subtitle="المبالغ تُحلل إلى minor units بدون float"/>
        <form className="form-grid" onSubmit={createJournalReview}>
          <input name="entryNumber" placeholder="رقم القيد JE-001" required/>
          <input name="entryDate" type="date" required/>
          <input name="accountCode" placeholder="رمز الحساب" required/>
          <input name="accountName" placeholder="اسم الحساب"/>
          <input name="debit" inputMode="decimal" placeholder="مدين بالوحدة الرئيسية 1000.00" defaultValue="0"/>
          <input name="credit" inputMode="decimal" placeholder="دائن بالوحدة الرئيسية 0.00" defaultValue="0"/>
          <input name="description" placeholder="وصف القيد"/>
          <input name="userName" placeholder="المستخدم"/>
          <input name="sourceVersion" placeholder="إصدار المصدر (اختياري)"/>
          <label className="check-row"><input name="isManual" type="checkbox"/> قيد يدوي</label>
          <button disabled={busy}>تشغيل التحليل</button>
        </form>
      </section>

      <section className="panel-glass"><SectionHead title="المعاينة" subtitle="Random / systematic / MUS · seed مسجل"/>
        <form className="form-stack" onSubmit={createSample}>
          <label>مجتمع العينة<textarea name="populationIds" placeholder="JE-001, JE-002, JE-003" required/></label>
          <div className="inline-form"><select name="method" defaultValue="random"><option value="random">Random</option><option value="systematic">Systematic</option><option value="mus">MUS</option></select><input name="size" type="number" min="1" defaultValue="2" required/><input name="seed" type="number" defaultValue="20260904" required/></div>
          <input name="populationSource" defaultValue="journal-review" placeholder="مصدر المجتمع" required/>
          <button disabled={busy}>إنشاء snapshot للعينة</button>
        </form>
        <div className="card-list compact-list">{samplingRuns.slice(0, 4).map((sample) => <div className="list-card" key={sample.id}><div><Badge>{sample.method}</Badge><strong>Seed {sample.seed}</strong><small>{sample.population_source} · {sample.engine_version}</small></div></div>)}{!samplingRuns.length && <p className="muted">لا توجد عينات محفوظة بعد.</p>}</div>
      </section>
    </div>

    <section className="panel-glass"><SectionHead title="إشارات تحتاج حكم المراجع" subtitle={`${pending.length} إشارة معلقة · كل قرار يسجل actor + rationale`}/>{loading && <p className="muted">تحديث النتائج…</p>}<div className="card-list">{items.map((item) => <article className="list-card journal-item" key={item.id}><div><Badge tone={item.status === 'pending' ? 'warn' : item.disposition === 'exception' ? 'bad' : 'ok'}>{item.signal_code} · {item.severity}</Badge><strong>{item.entry_number} · {item.account_code} {item.account_name ?? ''}</strong><p>{item.rationale}</p><small>{item.entry_date ?? 'بدون تاريخ'} · مدين {formatMinor(item.debit_minor)} · دائن {formatMinor(item.credit_minor)}{item.user_name ? ` · ${item.user_name}` : ''}</small>{item.decision_rationale && <small>قرار المراجع: {item.decision_rationale}</small>}</div>{item.status === 'pending' && <div className="row-actions"><button disabled={busy} className="small-action" onClick={() => decide(item, 'cleared')}>إقفال بمبرر</button><button disabled={busy} className="small-action danger-action" onClick={() => decide(item, 'exception')}>استثناء</button></div>}</article>)}{!items.length && <p className="muted">لا توجد إشارات بعد. شغّل فحصًا على قيد أو استخدم Demo التعليمي.</p>}</div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric-card neutral"><div><span>{label}</span><strong>{value}</strong></div></div>;
}
