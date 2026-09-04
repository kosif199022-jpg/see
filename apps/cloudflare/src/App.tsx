import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, downloadFile, getAccessToken, setAccessToken } from './api';

type Engagement = { id: string; name: string; client_name: string; period_end: string; status: string };
type Dashboard = {
  engagement: Engagement;
  trialBalance: { lines: Array<Record<string, any>>; validation: { balanced: boolean; totalDebit: string; totalCredit: string; errors: string[] } };
  mappings: Array<Record<string, any>>;
  materiality: Array<Record<string, any>>;
  risks: Array<Record<string, any>>;
  evidence: Array<Record<string, any>>;
  findings: Array<Record<string, any>>;
  events: Array<Record<string, any>>;
  summary: { readyForHumanSignoff: boolean; blockers: string[]; status: string };
};
type Tab = 'overview' | 'tb' | 'mapping' | 'planning' | 'evidence' | 'report';

const money = (minor: number | string) => new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(Number(minor) / 100);

function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) throw new Error('CSV يجب أن يحتوي على رأس وبيانات');
  const headers = rows[0].split(',').map((value) => value.trim().toLowerCase());
  const index = (names: string[]) => names.map((name) => headers.indexOf(name)).find((value) => value !== -1) ?? -1;
  const codeIndex = index(['account_code', 'code', 'account']);
  const nameIndex = index(['account_name', 'name', 'description']);
  const debitIndex = index(['debit', 'debit_minor']);
  const creditIndex = index(['credit', 'credit_minor']);
  if (nameIndex === -1 || debitIndex === -1 || creditIndex === -1) throw new Error('الأعمدة المطلوبة: account_name,debit,credit');
  return rows.slice(1).map((row, i) => {
    const cells = row.split(',').map((value) => value.trim());
    return {
      accountCode: codeIndex === -1 ? String(i + 1) : cells[codeIndex],
      accountName: cells[nameIndex],
      debitMinor: Math.round(Number(cells[debitIndex] || 0) * 100),
      creditMinor: Math.round(Number(cells[creditIndex] || 0) * 100),
    };
  });
}

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState(getAccessToken());

  const latestMappings = useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    for (const row of dashboard?.mappings ?? []) if (!map.has(String(row.tb_line_id))) map.set(String(row.tb_line_id), row);
    return map;
  }, [dashboard]);

  async function refreshEngagements(preferred?: string) {
    const result = await api<{ engagements: Engagement[] }>('/api/engagements');
    setEngagements(result.engagements);
    const target = preferred || selectedId || result.engagements[0]?.id || '';
    setSelectedId(target);
    if (target) await refreshDashboard(target);
  }
  async function refreshDashboard(id: string) { setDashboard(await api<Dashboard>(`/api/engagements/${id}/dashboard`)); }
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'حدث خطأ غير متوقع'); }
    finally { setBusy(false); }
  }
  useEffect(() => { refreshEngagements().catch((cause) => setError(cause.message)); }, []);

  async function createDemo() {
    await run(async () => { const result = await api<{ id: string }>('/api/demo', { method: 'POST' }); await refreshEngagements(result.id); }, 'تم إنشاء مهمة تجريبية كاملة.');
  }
  async function createEngagement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(async () => {
      const result = await api<{ id: string }>('/api/engagements', { method: 'POST', body: JSON.stringify({ name: form.get('name'), clientName: form.get('clientName'), periodEnd: form.get('periodEnd') }) });
      event.currentTarget.reset(); await refreshEngagements(result.id);
    }, 'تم إنشاء المهمة.');
  }
  async function importTb(file: File) {
    const lines = parseCsv(await file.text());
    await run(async () => { await api(`/api/engagements/${selectedId}/trial-balance`, { method: 'POST', body: JSON.stringify({ lines }) }); await refreshDashboard(selectedId); }, `تم استيراد ${lines.length} سطرًا مع تحقق التوازن.`);
  }
  async function saveMapping(lineId: string, statementLine: string) {
    await run(async () => {
      const proposed = await api<{ id: string }>(`/api/engagements/${selectedId}/mappings`, { method: 'POST', body: JSON.stringify({ tbLineId: lineId, statementLine, confidence: 100, rationale: 'Human mapping in SEE workspace' }) });
      await api(`/api/mappings/${proposed.id}/approve`, { method: 'POST' }); await refreshDashboard(selectedId);
    }, 'تم حفظ واعتماد التصنيف بإصدار جديد.');
  }
  async function addMateriality(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(async () => {
      const created = await api<{ id: string }>(`/api/engagements/${selectedId}/materiality`, { method: 'POST', body: JSON.stringify({ benchmarkMinor: Math.round(Number(form.get('benchmark')) * 100), basisPoints: Number(form.get('basisPoints')), rationale: form.get('rationale') }) });
      await api(`/api/materiality/${created.id}/approve`, { method: 'POST' }); event.currentTarget.reset(); await refreshDashboard(selectedId);
    }, 'تم احتساب واعتماد الأهمية النسبية حتميًا.');
  }
  async function addRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(async () => {
      const created = await api<{ id: string }>(`/api/engagements/${selectedId}/risks`, { method: 'POST', body: JSON.stringify({ title: form.get('title'), likelihood: Number(form.get('likelihood')), magnitude: Number(form.get('magnitude')), controlReliance: Number(form.get('controlReliance')), rationale: form.get('rationale') }) });
      await api(`/api/risks/${created.id}/approve`, { method: 'POST' }); event.currentTarget.reset(); await refreshDashboard(selectedId);
    }, 'تم تسجيل الخطر واعتماد تقييمه.');
  }
  async function uploadEvidence(file: File) {
    const form = new FormData(); form.append('file', file);
    await run(async () => { await api(`/api/engagements/${selectedId}/evidence`, { method: 'POST', body: form }); await refreshDashboard(selectedId); }, 'تم حفظ الدليل في R2 وتسجيل بصمته SHA-256.');
  }
  async function addFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(async () => {
      await api(`/api/engagements/${selectedId}/findings`, { method: 'POST', body: JSON.stringify({ title: form.get('title'), severity: form.get('severity'), description: form.get('description'), evidenceId: form.get('evidenceId') || undefined }) });
      event.currentTarget.reset(); await refreshDashboard(selectedId);
    }, 'تم تسجيل الملاحظة وربطها بالمهمة.');
  }

  const nav: Array<[Tab, string]> = [['overview','مركز القيادة'],['tb','ميزان المراجعة'],['mapping','التصنيف'],['planning','التخطيط والمخاطر'],['evidence','الأدلة والملاحظات'],['report','الإقفال والتقرير']];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><div><strong>SEE</strong><small>Audit Operating System</small></div></div>
      <nav>{nav.map(([key,label]) => <button key={key} className={tab===key?'active':''} onClick={() => setTab(key)}>{label}</button>)}</nav>
      <div className="sidebar-foot">Evidence before conclusion<br/>الإصدار التجريبي 0.2</div>
    </aside>
    <main className="workspace">
      <header className="topbar">
        <div><p className="eyebrow">مساحة مراجعة قابلة للتتبع</p><h1>{nav.find(([key]) => key===tab)?.[1]}</h1></div>
        <div className="top-actions">
          <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); refreshDashboard(e.target.value).catch((cause) => setError(cause.message)); }}>
            <option value="">اختر مهمة</option>{engagements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="secondary" onClick={createDemo} disabled={busy}>إنشاء Demo</button>
        </div>
      </header>
      <div className="demo-banner">بيئة Pilot عامة افتراضيًا. لا ترفع بيانات عميل حقيقية قبل تفعيل APP_ACCESS_TOKEN وضوابط الوصول.</div>
      {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}

      {!selectedId && <section className="empty-state"><h2>ابدأ مهمة مراجعة</h2><p>أنشئ مهمة جديدة أو استخدم البيانات التجريبية لرؤية المسار الكامل.</p><form className="grid-form" onSubmit={createEngagement}><input name="name" placeholder="اسم المهمة" required/><input name="clientName" placeholder="اسم العميل" required/><input name="periodEnd" type="date" required/><button disabled={busy}>إنشاء المهمة</button></form></section>}

      {selectedId && dashboard && tab==='overview' && <>
        <section className="hero-card"><div><span className="pill">{dashboard.engagement.status}</span><h2>{dashboard.engagement.name}</h2><p>{dashboard.engagement.client_name} · الفترة المنتهية {dashboard.engagement.period_end}</p></div><div className={dashboard.summary.readyForHumanSignoff?'status-ready':'status-blocked'}>{dashboard.summary.readyForHumanSignoff?'جاهز للمراجعة البشرية':'بوابات إقفال مفتوحة'}</div></section>
        <section className="kpi-grid"><Kpi label="سطور TB" value={dashboard.trialBalance.lines.length} detail={dashboard.trialBalance.validation.balanced?'متوازن':'غير متوازن'}/><Kpi label="مخاطر عالية" value={dashboard.risks.filter((r) => r.level==='high' && r.status!=='closed').length} detail="تتطلب استجابة"/><Kpi label="الأدلة" value={dashboard.evidence.length} detail="R2 + SHA-256"/><Kpi label="ملاحظات مفتوحة" value={dashboard.findings.filter((f) => f.status!=='resolved').length} detail="قبل الإقفال"/></section>
        <section className="two-col"><Card title="حالة الإقفال"><p>{dashboard.summary.status}</p>{dashboard.summary.blockers.length>0 && <ul>{dashboard.summary.blockers.map((b) => <li key={b}>{b}</li>)}</ul>}</Card><Card title="آخر أحداث سجل التدقيق"><Timeline rows={dashboard.events.slice(0,6)}/></Card></section>
      </>}

      {selectedId && dashboard && tab==='tb' && <section className="panel"><PanelHead title="ميزان المراجعة" subtitle="CSV: account_code,account_name,debit,credit — القيم بالوحدات الرئيسية"/><label className="upload-box">اختيار ملف CSV<input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && importTb(e.target.files[0])} disabled={busy || dashboard.trialBalance.lines.length>0}/></label><div className="recon"><b>مدين: {money(dashboard.trialBalance.validation.totalDebit)}</b><b>دائن: {money(dashboard.trialBalance.validation.totalCredit)}</b><span className={dashboard.trialBalance.validation.balanced?'ok':'bad'}>{dashboard.trialBalance.validation.balanced?'متوازن':'غير متوازن'}</span></div><Table rows={dashboard.trialBalance.lines.map((r) => [r.account_code,r.account_name,money(r.debit_minor),money(r.credit_minor)])} headers={['الرمز','الحساب','مدين','دائن']}/></section>}

      {selectedId && dashboard && tab==='mapping' && <section className="panel"><PanelHead title="تصنيف الحسابات" subtitle="أي تعديل ينشئ version جديد؛ الاعتماد يمنع التغيير الصامت."/>{dashboard.trialBalance.lines.map((line) => <MappingRow key={line.id} line={line} mapping={latestMappings.get(String(line.id))} onSave={saveMapping}/>)}</section>}

      {selectedId && dashboard && tab==='planning' && <section className="two-col"><Card title="الأهمية النسبية"><form className="stack" onSubmit={addMateriality}><input name="benchmark" type="number" min="0" step="0.01" placeholder="Benchmark" required/><input name="basisPoints" type="number" min="1" max="10000" defaultValue="500" required/><textarea name="rationale" placeholder="مبرر اختيار الأساس والنسبة" required/><button disabled={busy}>احتساب واعتماد</button></form>{dashboard.materiality[0] && <div className="result"><b>{money(dashboard.materiality[0].amount_minor)}</b><span>{dashboard.materiality[0].basis_points/100}% · {dashboard.materiality[0].status}</span></div>}</Card><Card title="تقييم خطر"><form className="stack" onSubmit={addRisk}><input name="title" placeholder="عنوان الخطر" required/><div className="triple"><Score name="likelihood" label="الاحتمال"/><Score name="magnitude" label="الحجم"/><Score name="controlReliance" label="الاعتماد على الرقابة"/></div><textarea name="rationale" placeholder="المبرر المهني" required/><button disabled={busy}>تقييم واعتماد</button></form>{dashboard.risks.map((risk) => <div className="risk-row" key={risk.id}><span className={`risk ${risk.level}`}>{risk.score}</span><div><b>{risk.title}</b><small>{risk.rationale}</small></div></div>)}</Card></section>}

      {selectedId && dashboard && tab==='evidence' && <section className="two-col"><Card title="مستودع الأدلة"><label className="upload-box">رفع دليل (حتى 10MB)<input type="file" onChange={(e) => e.target.files?.[0] && uploadEvidence(e.target.files[0])}/></label>{dashboard.evidence.map((item) => <div className="evidence-row" key={item.id}><div><b>{item.name}</b><small>SHA-256 {String(item.sha256).slice(0,16)}… · {Math.round(item.size/1024)} KB</small></div><button className="link-button" onClick={() => run(() => downloadFile(`/api/evidence/${item.id}/download`, item.name), 'تم تنزيل الدليل.')}>تنزيل</button></div>)}</Card><Card title="الملاحظات"><form className="stack" onSubmit={addFinding}><input name="title" placeholder="عنوان الملاحظة" required/><select name="severity" defaultValue="medium"><option value="low">منخفض</option><option value="medium">متوسط</option><option value="high">عالٍ</option><option value="critical">حرج</option></select><select name="evidenceId" defaultValue=""><option value="">بدون ربط مباشر</option>{dashboard.evidence.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><textarea name="description" placeholder="الوصف والأثر" required/><button disabled={busy}>تسجيل</button></form>{dashboard.findings.map((finding) => <div className="finding" key={finding.id}><span>{finding.severity}</span><div><b>{finding.title}</b><small>{finding.description}</small></div>{finding.status!=='resolved' && <button className="link-button" onClick={() => run(async () => { await api(`/api/findings/${finding.id}/resolve`,{method:'POST'}); await refreshDashboard(selectedId); },'تم حل الملاحظة.')}>حل</button>}</div>)}</Card></section>}

      {selectedId && dashboard && tab==='report' && <section className="panel report"><PanelHead title="بوابة الإقفال" subtitle="SEE لا يصدر رأيًا نظاميًا تلقائيًا؛ القرار النهائي يتطلب توقيعًا بشريًا."/><div className={dashboard.summary.readyForHumanSignoff?'report-ready':'report-blocked'}><h2>{dashboard.summary.readyForHumanSignoff?'جاهز للتوقيع البشري':'غير جاهز للإقفال'}</h2><p>{dashboard.summary.status}</p></div><div className="trace-grid"><Kpi label="TB" value={dashboard.trialBalance.validation.balanced?'✓':'!'} detail="reconciliation"/><Kpi label="Mappings" value={dashboard.trialBalance.lines.length} detail="versioned"/><Kpi label="Evidence" value={dashboard.evidence.length} detail="hashed objects"/><Kpi label="Findings" value={dashboard.findings.filter((f)=>f.status!=='resolved').length} detail="open"/></div><Card title="سجل التتبع"><Timeline rows={dashboard.events}/></Card></section>}

      <footer className="security-box"><div><b>رمز الوصول الاختياري</b><small>إذا ضُبط APP_ACCESS_TOKEN على Worker أدخله هنا؛ يُحفظ في sessionStorage فقط.</small></div><input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token"/><button className="secondary" onClick={() => { setAccessToken(token); refreshEngagements().catch((cause)=>setError(cause.message)); }}>حفظ للجلسة</button></footer>
    </main>
  </div>;
}

function Kpi({label,value,detail}:{label:string;value:string|number;detail:string}) { return <div className="kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Card({title,children}:{title:string;children:any}) { return <section className="card"><h3>{title}</h3>{children}</section>; }
function PanelHead({title,subtitle}:{title:string;subtitle:string}) { return <div className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
function Table({headers,rows}:{headers:string[];rows:any[][]}) { return <div className="table-wrap"><table><thead><tr>{headers.map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>; }
function Timeline({rows}:{rows:Array<Record<string,any>>}) { return <div className="timeline">{rows.length===0?<p>لا توجد أحداث بعد.</p>:rows.map((row)=><div key={row.id}><span></span><div><b>{row.action}</b><small>{row.entity_type} · {new Date(row.created_at).toLocaleString('ar-SA')}</small></div></div>)}</div>; }
function Score({name,label}:{name:string;label:string}) { return <label><span>{label}</span><select name={name} defaultValue="3">{[1,2,3,4,5].map((n)=><option key={n} value={n}>{n}</option>)}</select></label>; }
function MappingRow({line,mapping,onSave}:{line:Record<string,any>;mapping?:Record<string,any>;onSave:(id:string,target:string)=>void}) { const [target,setTarget]=useState(mapping?.statement_line??''); return <div className="mapping-row"><div><b>{line.account_code} · {line.account_name}</b><small>{money(Number(line.debit_minor)-Number(line.credit_minor))}</small></div><input value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Financial statement line"/><span className={mapping?.status==='approved'?'ok':'pending'}>{mapping?.status??'unmapped'}</span><button onClick={()=>target.trim()&&onSave(String(line.id),target.trim())}>حفظ واعتماد</button></div>; }
