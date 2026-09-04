import type { CommandCenter, LegacyDashboard } from '../types';
import { Badge, SectionHead } from './Status';

function exactMinor(minor: string) {
  const value = BigInt(minor || '0'); const sign = value < 0n ? '-' : ''; const abs = value < 0n ? -value : value;
  return `${sign}${new Intl.NumberFormat('ar-SA').format(abs / 100n)}٫${(abs % 100n).toString().padStart(2, '0')}`;
}

export function AnalyticsCenter({ commandCenter, legacy }: { commandCenter: CommandCenter; legacy: LegacyDashboard }) {
  const a = commandCenter.analytics;
  const riskTotal = a.riskMix.high + a.riskMix.medium || 1;
  return <div className="workspace-view analytics-center">
    <div className="workspace-title"><div><Badge tone="evidence">DETERMINISTIC</Badge><h1>مركز التحليلات</h1><p>مؤشرات مراجعة مشتقة من البيانات الفعلية؛ لا بطاقة هنا تمثل رأيًا أو استنتاجًا تلقائيًا.</p></div><div className="method-card"><span>المحرك</span><strong>{a.method}</strong><small>authority: {a.authority}</small></div></div>

    <section className="analytics-hero panel-glass"><div><span className="overline">Trial Balance Integrity</span><strong className="big-number">{exactMinor(a.tbDifferenceMinor)}</strong><p>فرق المدين والدائن بالوحدات الصغرى المحولة للعرض.</p></div><Badge tone={a.tbDifferenceMinor === '0' && a.accountCount > 0 ? 'ok' : 'bad'}>{a.tbDifferenceMinor === '0' && a.accountCount > 0 ? 'MATCH' : 'REVIEW'}</Badge></section>

    <section className="analytics-grid">
      <div className="panel-glass"><SectionHead title="الحركة الإجمالية" subtitle="Exact minor-unit projection"/><div className="paired-values"><div><span>إجمالي المدين</span><strong>{exactMinor(a.totalDebitMinor)}</strong></div><div><span>إجمالي الدائن</span><strong>{exactMinor(a.totalCreditMinor)}</strong></div></div></div>
      <div className="panel-glass"><SectionHead title="مزيج المخاطر" subtitle="Open risk indicators"/><div className="risk-bars"><Bar label="عالية" value={a.riskMix.high} max={riskTotal} tone="risk"/><Bar label="متوسطة" value={a.riskMix.medium} max={riskTotal} tone="warning"/></div><small className="indicator-note">مؤشر — ليس استنتاج مراجعة.</small></div>
      <div className="panel-glass"><SectionHead title="جودة البيانات"/><div className="mini-metrics"><div><b>{a.accountCount}</b><span>حسابات TB</span></div><div><b>{commandCenter.metrics.unmappedAccounts}</b><span>غير مربوطة</span></div><div><b>{legacy.trialBalance.validation.errors.length}</b><span>أخطاء تحقق</span></div></div></div>
      <div className="panel-glass"><SectionHead title="نتائج مفتوحة"/><div className="finding-orbit"><strong>{a.openFindingCount}</strong><span>Finding يحتاج معالجة أو استنتاج بشري</span></div></div>
    </section>

    <section className="panel-glass future-modules"><SectionHead title="مختبر التحليلات القادم" subtitle="قدرات منتقاة من SKY/KOSIF ستدخل بعد تثبيت GL والبيانات المطلوبة"/><div className="capability-grid"><Capability title="Benford" text="مؤشر الرقم الأول — review signal فقط"/><Capability title="Journal Anomalies" text="قيود كبيرة/دائرية/فترة الإقفال ومؤشرات أخرى"/><Capability title="Aging + ECL" text="أعمار الذمم وسياسات loss-rate versioned"/><Capability title="Reconciliations" text="TB↔GL والبنوك والسجلات الفرعية"/><Capability title="Trend / Forecast" text="تحليل زمني عندما تتوفر سلسلة موثوقة"/><Capability title="VAT / Zakat" text="قواعد فعالة بتاريخ واختبارات ومصدر سعودي"/></div><p className="indicator-note">هذه البطاقات خريطة قدرة فقط ولا تعرض نتائج تجريبية أو أرقامًا اصطناعية.</p></section>
  </div>;
}

function Bar({ label,value,max,tone }: { label:string; value:number; max:number; tone:string }) { return <div className="analytics-bar"><div><span>{label}</span><b>{value}</b></div><div className="bar-track"><i className={tone} style={{ width: `${Math.min(100, Math.round((value/max)*100))}%` }}/></div></div>; }
function Capability({ title,text }: { title:string;text:string }) { return <div className="capability-card"><span>◌</span><strong>{title}</strong><p>{text}</p><Badge>Phase B+</Badge></div>; }
