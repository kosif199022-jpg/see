import type { CSSProperties } from 'react';
import { labelStage } from '../navigation';
import type { CommandCenter as CommandCenterDto, PrimaryWorkspace } from '../types';
import { Badge, BlockerList, SectionHead } from './Status';

const readinessLabel = (value: CommandCenterDto['readiness']['label']) => value === 'ready_for_human_review' ? 'جاهز للمراجعة البشرية' : value === 'blocked' ? 'متوقف' : 'قيد التنفيذ';
const statusTone = (value: CommandCenterDto['readiness']['label']) => value === 'ready_for_human_review' ? 'ok' : value === 'blocked' ? 'bad' : 'warn';

export function CommandCenter({ data, onNavigate }: { data: CommandCenterDto; onNavigate: (workspace: PrimaryWorkspace) => void }) {
  const metrics = data.metrics;
  const mappedPercent = metrics.trialBalanceLines ? Math.round((metrics.approvedMappings / metrics.trialBalanceLines) * 100) : 0;

  return <div className="workspace-view command-center">
    <section className="command-hero">
      <div className="hero-copy"><div className="eyebrow-row"><Badge tone="evidence">LIVE TRACE</Badge><span>آخر حالة من D1</span></div><h1>{data.engagement.name}</h1><p>{data.engagement.client_name} · الفترة المنتهية {data.engagement.period_end}</p><div className="hero-actions"><button className="primary-action" onClick={() => onNavigate('audit')}>متابعة المراجعة</button><button className="ghost-action" onClick={() => onNavigate('more')}>فتح سجل الأثر</button></div></div>
      <div className="readiness-orbit"><div className="score-ring" style={{ '--score': `${data.readiness.score * 3.6}deg` } as CSSProperties}><div><strong>{data.readiness.score}</strong><span>/100</span></div></div><Badge tone={statusTone(data.readiness.label)}>{readinessLabel(data.readiness.label)}</Badge><small>{data.readiness.method}</small></div>
    </section>

    <section className="metric-grid">
      <Metric icon="▤" label="ميزان المراجعة" value={metrics.trialBalanceLines} detail={data.analytics.tbDifferenceMinor === '0' && metrics.trialBalanceLines > 0 ? 'متوازن حتميًا' : 'يحتاج تحقق'} tone={data.analytics.tbDifferenceMinor === '0' && metrics.trialBalanceLines > 0 ? 'ok' : 'warn'}/>
      <Metric icon="↔" label="اكتمال الربط" value={`${mappedPercent}%`} detail={`${metrics.approvedMappings} معتمد · ${metrics.unmappedAccounts} متبقٍ`} tone={metrics.unmappedAccounts === 0 && metrics.trialBalanceLines > 0 ? 'ok' : 'warn'}/>
      <Metric icon="△" label="المخاطر العالية" value={metrics.openHighRisks} detail={`${metrics.openMediumRisks} مخاطر متوسطة مفتوحة`} tone={metrics.openHighRisks ? 'bad' : 'ok'}/>
      <Metric icon="◇" label="تغطية الأدلة" value={metrics.evidenceCount} detail={`${metrics.traceHealth.linked} مرتبط · ${metrics.traceHealth.gaps} فجوات`} tone={metrics.traceHealth.gaps === 0 && metrics.evidenceCount ? 'ok' : 'evidence'}/>
      <Metric icon="✓" label="الإجراءات" value={metrics.procedures} detail={`${metrics.completedProcedureRuns} تشغيل مكتمل`} tone="neutral"/>
      <Metric icon="⌁" label="ملاحظات المراجعة" value={metrics.openReviewNotes} detail={`${metrics.openFindings} نتيجة مفتوحة`} tone={metrics.openReviewNotes || metrics.openFindings ? 'warn' : 'ok'}/>
      <Metric icon="≋" label="فحص القيود" value={metrics.journalPendingReview} detail={`${metrics.journalFlagged} إشارة حتمية · القرار للمراجع`} tone={metrics.journalPendingReview ? 'warn' : 'ok'}/>
      <Metric icon="A10" label="الجولات المهنية" value={`${metrics.roundsReady.completed}/${metrics.roundsReady.total}`} detail={metrics.roundsReady.attention ? `${metrics.roundsReady.attention} جولة تحتاج انتباه` : metrics.roundsReady.ready ? 'الجولات العشر مكتملة' : 'تنتظر قرارات بشرية'} tone={metrics.roundsReady.ready ? 'ok' : metrics.roundsReady.attention ? 'warn' : 'neutral'}/>
    </section>

    <section className="stage-panel panel-glass"><SectionHead title="مسار المهمة" subtitle="الدورة المهنية الكاملة — العرض لا يتجاوز البوابات تلقائيًا"/><div className="stage-rail">{data.stages.map((stage, index) => <div className={`stage-chip ${stage.state}`} key={stage.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{labelStage(stage.id)}</b></div>)}</div></section>

    <section className="dashboard-grid">
      <div className="panel-glass readiness-panel"><SectionHead title="بوابات الجاهزية" subtitle="الأسباب الفعلية التي تمنع الإقفال"/><BlockerList blockers={data.readiness.blockers}/></div>
      <div className="panel-glass council-pulse"><SectionHead title="نبض مجلس AI" subtitle="استشاري فقط — لا اعتماد تلقائي"/><div className="council-state"><div className="council-orb">AI</div>{data.council ? <><strong>{String(data.council.status)}</strong><p>{String(data.council.task)}</p><small>{String(data.council.created_at ?? '')}</small></> : <><strong>لا توجد جلسة بعد</strong><p>ابدأ جلسة من مجلس AI باستخدام أدلة محددة.</p></>}</div><button className="ghost-action full" onClick={() => onNavigate('council')}>فتح المجلس</button></div>
      <div className="panel-glass timeline-panel"><SectionHead title="آخر أحداث الأثر" subtitle="Append-only professional trail"/><div className="audit-timeline">{data.recentEvents.length ? data.recentEvents.slice(0, 8).map((event) => <div className="timeline-row" key={String(event.id)}><i/><div><strong>{String(event.action)}</strong><span>{String(event.entity_type)} · {String(event.actor)}</span></div><time>{String(event.created_at).slice(0, 16).replace('T', ' ')}</time></div>) : <p className="muted">لا توجد أحداث مسجلة.</p>}</div></div>
      <div className="panel-glass trace-summary"><SectionHead title="سلامة المسار" subtitle="من البيانات إلى الاستنتاج"/><div className="trace-kpis"><div><strong>{metrics.traceHealth.evidence}</strong><span>أدلة</span></div><div><strong>{metrics.traceHealth.linked}</strong><span>أدلة مرتبطة</span></div><div><strong>{metrics.traceHealth.gaps}</strong><span>فجوات ربط</span></div></div><p className="muted">صحة المسار محسوبة من روابط D1 الفعلية؛ وجود فجوة لا يعني استنتاجًا تلقائيًا.</p><button className="ghost-action full" onClick={() => onNavigate('more')}>استكشاف شبكة الأدلة</button></div>
    </section>
  </div>;
}

function Metric({ icon, label, value, detail, tone }: { icon: string; label: string; value: string | number; detail: string; tone: string }) {
  return <div className={`metric-card ${tone}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}
