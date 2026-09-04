import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { phaseAApi } from '../api';
import type { LegacyDashboard, Perform, StandardReference, StandardUsage } from '../types';
import { Badge, SectionHead } from './Status';

export function StandardsWorkspace({ engagementId, legacy, perform, mode, busy }: {
  engagementId: string;
  legacy: LegacyDashboard;
  perform: Perform;
  mode: 'standards' | 'knowledge';
  busy: boolean;
}) {
  const [standards, setStandards] = useState<StandardReference[]>([]);
  const [usages, setUsages] = useState<StandardUsage[]>([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const [library, linked] = await Promise.all([phaseAApi.standards(), phaseAApi.standardsUsage(engagementId)]);
      setStandards(library.standards);
      setNotice(library.notice);
      setUsages(linked.usages);
    } finally { setLoading(false); }
  }

  useEffect(() => { reload().catch(() => undefined); }, [engagementId]);

  const grouped = useMemo(() => {
    const map = new Map<string, StandardReference[]>();
    for (const item of standards) map.set(item.sourceFamily, [...(map.get(item.sourceFamily) ?? []), item]);
    return [...map.entries()];
  }, [standards]);

  async function link(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform(async () => {
      await phaseAApi.createStandardsUsage(engagementId, {
        standardCode: String(form.get('standardCode') ?? ''),
        targetType: String(form.get('targetType') ?? ''),
        targetId: String(form.get('targetId') ?? '').trim(),
        rationale: String(form.get('rationale') ?? '').trim(),
        actor: 'pilot-manager',
      });
      event.currentTarget.reset();
      await reload();
    }, 'تم ربط المرجع بالقرار مع provenance وإصدار المصدر.');
  }

  return <div className="workspace-view professional-workspace standards-workspace">
    <div className="workspace-title"><div><Badge tone="evidence">PROVENANCE</Badge><h1>{mode === 'standards' ? 'المعايير والمصادر' : 'مسارات المعرفة'}</h1><p>{mode === 'standards' ? 'بطاقات مرجعية موسومة بالعائلة والحالة والإصدار؛ لا تستبدل النص الرسمي.' : 'معرفة تطبيقية منظمة حسب عائلة المصدر، مع فصل المرجع عن الحكم المهني.'}</p></div><div className="engagement-state"><small>روابط مستخدمة</small><strong>{usages.length}</strong></div></div>
    {notice && <div className="alert warning">{notice}</div>}

    {mode === 'standards' && <section className="panel-glass"><SectionHead title="ربط مرجع بقرار أو ورقة عمل" subtitle="يحفظ source family/version/target/rationale"/><form className="form-grid" onSubmit={link}>
      <select name="standardCode" required><option value="">اختر المرجع</option>{standards.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.titleAr}</option>)}</select>
      <select name="targetType" required><option value="risk">Risk</option><option value="procedure">Procedure</option><option value="workpaper">Workpaper</option><option value="finding">Finding</option><option value="report_version">Report version</option><option value="trial_balance_line">TB line</option><option value="round_decision">Round decision</option></select>
      <input name="targetId" placeholder="معرف السجل الهدف" required/>
      <input name="rationale" placeholder="سبب استخدام المرجع"/>
      <button disabled={busy}>ربط المرجع</button>
    </form><div className="card-list compact-list">{usages.slice(0, 8).map((item) => <div className="list-card" key={item.id}><div><Badge tone="evidence">{item.standard_code}</Badge><strong>{item.target_type} · {item.target_id}</strong><small>{item.source_family}{item.source_version ? ` · ${item.source_version}` : ''} · {item.actor}</small>{item.rationale && <p>{item.rationale}</p>}</div></div>)}{!usages.length && <p className="muted">لم تُربط مراجع بسجلات المهمة بعد.</p>}</div></section>}

    <section className="panel-glass"><SectionHead title={mode === 'standards' ? 'المكتبة المرجعية' : 'خريطة المعرفة حسب المصدر'} subtitle={`${standards.length} بطاقة مرجعية · ${loading ? 'جارٍ التحديث' : 'من الخادم'}`}/>{grouped.map(([family, items]) => <div className="standard-family" key={family}><div className="family-heading"><h3>{family}</h3><Badge tone={family.toLowerCase().includes('local') ? 'warn' : 'neutral'}>{items.length}</Badge></div><div className="standards-grid">{items.map((item) => <article className="standard-card" key={item.code}><div className="standard-card-head"><strong>{item.code}</strong><Badge tone={item.status === 'current' ? 'ok' : item.status === 'local' ? 'warn' : 'evidence'}>{item.status}</Badge></div><h4>{item.titleAr}</h4><p>{item.note}</p><dl><div><dt>العائلة</dt><dd>{item.sourceFamily}</dd></div>{item.version && <div><dt>الإصدار</dt><dd>{item.version}</dd></div>}{item.effectiveDate && <div><dt>السريان</dt><dd>{item.effectiveDate}</dd></div>}{item.sourceNote && <div><dt>المصدر</dt><dd>{item.sourceNote}</dd></div>}</dl><small>Authority: reference only</small></article>)}</div></div>)}</section>

    {mode === 'knowledge' && <section className="panel-glass"><SectionHead title="ربط المعرفة بالعمل الفعلي"/><div className="mini-metrics"><div><b>{legacy.risks.length}</b><span>مخاطر يمكن ربطها</span></div><div><b>{legacy.findings.length}</b><span>نتائج</span></div><div><b>{usages.length}</b><span>روابط provenance</span></div></div><p className="muted">مسار المعرفة لا يولّد حكمًا مهنيًا تلقائيًا. استخدم شاشة «المعايير والمصادر» لإنشاء روابط موثقة بالسجل المستهدف.</p></section>}
  </div>;
}
