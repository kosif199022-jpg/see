import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiError, phaseAApi } from '../api';
import { AUDIT_STAGE_LABELS } from '../navigation';
import type { CommandCenter, LegacyDashboard, PbcRequest, Perform, Procedure, Workpaper } from '../types';
import { Badge, SectionHead } from './Status';

const AR_DIGITS: Record<string, string> = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
function normalizeDigits(value: string) { return value.replace(/[٠-٩۰-۹]/g, (digit) => AR_DIGITS[digit] ?? digit).replace(/٫/g, '.').trim(); }
function parseMinor(value: string) {
  const normalized = normalizeDigits(value).replace(/\s/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error(`قيمة مالية غير صالحة: ${value}`);
  const [whole, fraction = ''] = normalized.split('.');
  const minor = BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('القيمة تتجاوز نطاق التخزين الحالي في D1');
  return Number(minor);
}
function money(minor: number | string) {
  const value = BigInt(String(minor || 0)); const whole = value / 100n; const fraction = (value % 100n).toString().padStart(2, '0');
  return `${new Intl.NumberFormat('ar-SA').format(whole)}٫${fraction}`;
}
function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) throw new Error('CSV يجب أن يحتوي على رأس وبيانات');
  const headers = rows[0].split(',').map((value) => value.trim().toLowerCase());
  const index = (names: string[]) => names.map((name) => headers.indexOf(name)).find((value) => value !== -1) ?? -1;
  const codeIndex = index(['account_code', 'code', 'account']); const nameIndex = index(['account_name', 'name', 'description']);
  const debitIndex = index(['debit', 'debit_minor']); const creditIndex = index(['credit', 'credit_minor']);
  if (nameIndex === -1 || debitIndex === -1 || creditIndex === -1) throw new Error('الأعمدة المطلوبة: account_name,debit,credit');
  return rows.slice(1).map((row, i) => { const cells = row.split(',').map((value) => value.trim()); return {
    accountCode: codeIndex === -1 ? String(i + 1) : cells[codeIndex], accountName: cells[nameIndex],
    debitMinor: parseMinor(cells[debitIndex] || '0'), creditMinor: parseMinor(cells[creditIndex] || '0'),
  }; });
}

export function AuditWorkspace({ engagementId, legacy, commandCenter, perform, refresh, busy }: {
  engagementId: string; legacy: LegacyDashboard; commandCenter: CommandCenter; perform: Perform; refresh: () => Promise<void>; busy: boolean;
}) {
  const [stage, setStage] = useState('data_intake');
  const [pbc, setPbc] = useState<PbcRequest[]>([]); const [procedures, setProcedures] = useState<Procedure[]>([]); const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [phaseLoading, setPhaseLoading] = useState(false);
  const latestMappings = useMemo(() => { const map = new Map<string, Record<string, any>>(); for (const row of legacy.mappings) if (!map.has(String(row.tb_line_id))) map.set(String(row.tb_line_id), row); return map; }, [legacy.mappings]);

  async function reloadPhaseA() {
    setPhaseLoading(true);
    try {
      const [pbcData, procedureData, workpaperData] = await Promise.all([phaseAApi.pbc(engagementId), phaseAApi.procedures(engagementId), phaseAApi.workpapers(engagementId)]);
      setPbc(pbcData.requests); setProcedures(procedureData.procedures); setWorkpapers(workpaperData.workpapers);
    } finally { setPhaseLoading(false); }
  }
  useEffect(() => { reloadPhaseA().catch(() => undefined); }, [engagementId]);
  async function refreshEverything() { await Promise.all([refresh(), reloadPhaseA()]); }

  async function transitionEngagement(to: string, role: string, reason = '') {
    await perform(async () => { await phaseAApi.transitionEngagement(engagementId, { to, actorRole: role, reason, expectedStatus: legacy.engagement.status }); await refreshEverything(); }, `تم نقل المهمة إلى ${to}.`);
  }
  async function importTb(file: File) {
    const lines = parseCsv(await file.text());
    await perform(async () => { await api(`/api/engagements/${engagementId}/trial-balance`, { method: 'POST', body: JSON.stringify({ lines }) }); await refresh(); }, `تم استيراد ${lines.length} سطرًا والتحقق من التوازن.`);
  }
  async function saveMapping(lineId: string, statementLine: string) {
    await perform(async () => { const proposed = await api<{ id: string }>(`/api/engagements/${engagementId}/mappings`, { method: 'POST', body: JSON.stringify({ tbLineId: lineId, statementLine, confidence: 100, rationale: 'Human mapping in SEE audit workspace' }) }); await api(`/api/mappings/${proposed.id}/approve`, { method: 'POST' }); await refresh(); }, 'تم حفظ التصنيف واعتماده بإصدار جديد.');
  }
  async function materiality(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await perform(async () => { const created = await api<{ id: string }>(`/api/engagements/${engagementId}/materiality`, { method: 'POST', body: JSON.stringify({ benchmarkMinor: parseMinor(String(form.get('benchmark') || '0')), basisPoints: Number(form.get('basisPoints')), rationale: form.get('rationale') }) }); await api(`/api/materiality/${created.id}/approve`, { method: 'POST' }); event.currentTarget.reset(); await refresh(); }, 'تم احتساب واعتماد الأهمية النسبية حتميًا.');
  }
  async function risk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await perform(async () => { const created = await api<{ id: string }>(`/api/engagements/${engagementId}/risks`, { method: 'POST', body: JSON.stringify({ title: form.get('title'), likelihood: Number(form.get('likelihood')), magnitude: Number(form.get('magnitude')), controlReliance: Number(form.get('controlReliance')), rationale: form.get('rationale') }) }); await api(`/api/risks/${created.id}/approve`, { method: 'POST' }); event.currentTarget.reset(); await refresh(); }, 'تم تسجيل الخطر واعتماد تقييمه البشري.');
  }
  async function createPbc(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await perform(async () => { await phaseAApi.createPbc(engagementId, { title: form.get('title'), description: form.get('description'), priority: form.get('priority'), dueAt: form.get('dueAt'), createdBy: 'pilot-senior' }); event.currentTarget.reset(); await refreshEverything(); }, 'تم إنشاء طلب PBC.'); }
  async function movePbc(item: PbcRequest, to: string) { await perform(async () => { await phaseAApi.transitionPbc(item.id, { to, actorRole: to === 'accepted' || to === 'rejected' ? 'senior' : 'junior', actor: 'pilot-reviewer' }); await refreshEverything(); }, `تم تحديث طلب PBC إلى ${to}.`); }
  async function createProcedure(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await perform(async () => { await phaseAApi.createProcedure(engagementId, { title: form.get('title'), objective: form.get('objective'), procedureType: form.get('type'), riskId: form.get('riskId') || undefined, owner: 'pilot-senior' }); event.currentTarget.reset(); await refreshEverything(); }, 'تم إنشاء إجراء مراجعة.'); }
  async function completeProcedure(item: Procedure) { await perform(async () => { await phaseAApi.runProcedure(item.id, { result: 'تم التنفيذ من مساحة العمل', conclusion: 'يتطلب ربط الدليل ومراجعة الاستنتاج قبل الإقفال', status: 'completed', actor: 'pilot-senior' }); await refreshEverything(); }, 'تم تسجيل تشغيل الإجراء واستنتاجه.'); }
  async function createWorkpaper(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await perform(async () => { await phaseAApi.createWorkpaper(engagementId, { title: form.get('title'), procedureId: form.get('procedureId') || undefined, content: form.get('content'), conclusion: form.get('conclusion'), preparer: 'pilot-senior' }); event.currentTarget.reset(); await refreshEverything(); }, 'تم إنشاء ورقة العمل بإصدار 1.'); }
  async function advanceWorkpaper(item: Workpaper) { const next: Record<string,string> = { draft:'prepared', prepared:'reviewer_open', reviewer_open:'cleared', cleared:'approved', approved:'locked' }; const to = next[item.status]; if (!to) return; const role = to === 'approved' ? 'manager' : to === 'locked' ? 'partner' : 'senior'; await perform(async () => { await phaseAApi.transitionWorkpaper(item.id, { to, actorRole: role, actor: `pilot-${role}` }); await refreshEverything(); }, `تم تحديث ورقة العمل إلى ${to}.`); }
  async function addReviewNote(item: Workpaper) { const note = prompt('اكتب ملاحظة المراجع'); if (!note?.trim()) return; await perform(async () => { await phaseAApi.addReviewNote(item.id, { note: note.trim(), createdBy: 'pilot-reviewer' }); await refreshEverything(); }, 'تم فتح ملاحظة مراجعة وربطها بورقة العمل.'); }

  return <div className="workspace-view audit-workspace">
    <div className="workspace-title"><div><Badge tone="ai">AUDIT FLOW</Badge><h1>غرفة المراجعة</h1><p>من القبول إلى الأرشيف عبر بوابات مسجلة، لا قفزات صامتة.</p></div><div className="engagement-state"><small>حالة المهمة</small><strong>{legacy.engagement.status}</strong></div></div>
    <div className="audit-stage-scroll" role="tablist">{AUDIT_STAGE_LABELS.map(([id,label], index) => <button role="tab" aria-selected={stage === id} className={stage === id ? 'active' : ''} key={id} onClick={() => setStage(id)}><span>{index + 1}</span><b>{label}</b></button>)}</div>
    {phaseLoading && <div className="loading-line">تحديث مساحات العمل…</div>}

    {stage === 'acceptance' && <section className="panel-glass"><SectionHead title="القبول والاستقلال" subtitle="Phase A يطبق آلة الحالة؛ نماذج الاستقلال التفصيلية تأتي في Phase C."/><div className="two-column"><div><p>الحالة الحالية: <Badge tone="evidence">{legacy.engagement.status}</Badge></p><p className="muted">كل انتقال يسجل revision وaudit event. المهام الجديدة تبدأ draft.</p></div><LifecycleActions status={legacy.engagement.status} onTransition={transitionEngagement} busy={busy}/></div></section>}

    {stage === 'planning' && <div className="two-column"><section className="panel-glass"><SectionHead title="الأهمية النسبية" subtitle="Basis points + minor units · Human approval"/><form className="form-stack" onSubmit={materiality}><label>المبلغ المرجعي<input name="benchmark" inputMode="decimal" placeholder="1000000.00" required/></label><label>النسبة بالنقاط الأساسية<input name="basisPoints" type="number" min="1" max="10000" defaultValue="500" required/></label><label>المبرر المهني<textarea name="rationale" required/></label><button disabled={busy}>احتساب واعتماد</button></form>{legacy.materiality[0] && <div className="result-card"><strong>{money(legacy.materiality[0].amount_minor)}</strong><span>{Number(legacy.materiality[0].basis_points)/100}% · {String(legacy.materiality[0].status)}</span></div>}</section><section className="panel-glass"><SectionHead title="حالة التخطيط"/><p className="muted">المخاطر والتأكيدات والإجراءات تتكون كعقد مترابطة؛ التقييم الحتمي لا يصدر رأيًا.</p><div className="mini-metrics"><div><b>{legacy.risks.length}</b><span>مخاطر</span></div><div><b>{commandCenter.metrics.procedures}</b><span>إجراءات</span></div><div><b>{commandCenter.metrics.openPbc}</b><span>PBC مفتوح</span></div></div></section></div>}

    {stage === 'pbc' && <section className="panel-glass"><SectionHead title="طلبات PBC" subtitle="استلام المستند لا يعني قبول الدليل"/><form className="inline-form pbc-form" onSubmit={createPbc}><input name="title" placeholder="المستند أو البيان المطلوب" required/><select name="priority" defaultValue="high"><option value="low">منخفض</option><option value="medium">متوسط</option><option value="high">مرتفع</option><option value="critical">حرج</option></select><input name="dueAt" type="date"/><input name="description" placeholder="الوصف"/><button disabled={busy}>إضافة</button></form><div className="card-list">{pbc.map((item) => <div className="list-card" key={item.id}><div><Badge tone={item.status === 'accepted' ? 'ok' : item.status === 'rejected' ? 'bad' : 'warn'}>{item.status}</Badge><strong>{item.title}</strong><small>{item.priority} · revision {String(item.revision ?? 1)}</small></div><PbcActions item={item} onMove={movePbc}/></div>)}{pbc.length === 0 && <p className="muted">لا توجد طلبات بعد.</p>}</div></section>}

    {stage === 'data_intake' && <section className="panel-glass"><SectionHead title="استلام ميزان المراجعة" subtitle="CSV → exact minor units → deterministic balance validation"/><label className={`drop-zone ${legacy.trialBalance.lines.length ? 'disabled' : ''}`}><span>⇧</span><strong>{legacy.trialBalance.lines.length ? 'تم تحميل TB لهذه المهمة' : 'اختر ملف CSV'}</strong><small>account_code, account_name, debit, credit</small><input type="file" accept=".csv,text/csv" disabled={busy || legacy.trialBalance.lines.length > 0} onChange={(event) => event.target.files?.[0] && importTb(event.target.files[0])}/></label><div className="reconciliation-strip"><div><span>مدين</span><b>{money(legacy.trialBalance.validation.totalDebit)}</b></div><div><span>دائن</span><b>{money(legacy.trialBalance.validation.totalCredit)}</b></div><Badge tone={legacy.trialBalance.validation.balanced ? 'ok' : 'bad'}>{legacy.trialBalance.validation.balanced ? 'متوازن' : 'غير متوازن'}</Badge></div><DataTable headers={['الرمز','الحساب','مدين','دائن']} rows={legacy.trialBalance.lines.map((row) => [row.account_code,row.account_name,money(row.debit_minor),money(row.credit_minor)])}/></section>}

    {stage === 'mapping' && <section className="panel-glass"><SectionHead title="ربط الحسابات بالقوائم" subtitle="كل تعديل ينشئ version؛ الاعتماد يمنع التغيير الصامت"/><div className="mapping-list">{legacy.trialBalance.lines.map((line) => <MappingRow key={String(line.id)} line={line} mapping={latestMappings.get(String(line.id))} onSave={saveMapping}/>)}</div></section>}

    {stage === 'materiality' && <section className="panel-glass"><SectionHead title="الأهمية النسبية" subtitle="المحرك الحتمي + مبرر واعتماد بشري"/>{legacy.materiality.length ? legacy.materiality.map((item) => <div className="list-card" key={String(item.id)}><div><Badge tone={item.status === 'approved' ? 'ok' : 'warn'}>{String(item.status)}</Badge><strong>{money(item.amount_minor)}</strong><small>{String(item.version)} · {String(item.rationale)}</small></div></div>) : <p className="muted">استخدم قسم التخطيط لإنشاء التقييم الأول.</p>}</section>}

    {stage === 'risk' && <section className="panel-glass"><SectionHead title="سجل المخاطر" subtitle="الدرجة مؤشر حتمي؛ الاعتماد المهني منفصل"/><form className="inline-form risk-form" onSubmit={risk}><input name="title" placeholder="عنوان الخطر" required/><Score name="likelihood" label="الاحتمال"/><Score name="magnitude" label="الحجم"/><Score name="controlReliance" label="الرقابة"/><input name="rationale" placeholder="المبرر المهني" required/><button disabled={busy}>إضافة خطر</button></form><div className="card-list">{legacy.risks.map((item) => <div className="list-card" key={String(item.id)}><div><Badge tone={item.level === 'high' ? 'bad' : item.level === 'medium' ? 'warn' : 'ok'}>{String(item.level)} · {String(item.score)}</Badge><strong>{String(item.title)}</strong><small>{String(item.rationale)}</small></div></div>)}</div></section>}

    {stage === 'procedures' && <section className="panel-glass"><SectionHead title="إجراءات المراجعة" subtitle="Risk → procedure → run → evidence → workpaper"/><form className="inline-form" onSubmit={createProcedure}><input name="title" placeholder="اسم الإجراء" required/><input name="objective" placeholder="الهدف" required/><select name="type"><option value="substantive">Substantive</option><option value="controls">Controls</option><option value="analytics">Analytics</option><option value="other">Other</option></select><select name="riskId"><option value="">بدون ربط خطر</option>{legacy.risks.map((item) => <option value={String(item.id)} key={String(item.id)}>{String(item.title)}</option>)}</select><button>إضافة</button></form><div className="card-list">{procedures.map((item) => <div className="list-card" key={item.id}><div><Badge>{item.status}</Badge><strong>{item.title}</strong><small>{item.objective}{item.risk_title ? ` · خطر: ${item.risk_title}` : ''}</small></div><button className="small-action" onClick={() => completeProcedure(item)}>تسجيل تنفيذ</button></div>)}</div></section>}

    {stage === 'evidence' && <section className="panel-glass"><SectionHead title="الأدلة" subtitle="R2 + SHA-256 + روابط trace"/><div className="mini-metrics"><div><b>{commandCenter.metrics.evidenceCount}</b><span>دليل مسجل</span></div><div><b>{commandCenter.metrics.openPbc}</b><span>PBC مفتوح</span></div><div><b>{commandCenter.metrics.procedures}</b><span>إجراء</span></div></div><p className="muted">رفع الأدلة وربطها واستكشاف الشبكة موجود في مساحة «المزيد» ضمن Evidence Trace.</p></section>}

    {stage === 'workpapers' || stage === 'review' ? <section className="panel-glass"><SectionHead title={stage === 'workpapers' ? 'أوراق العمل' : 'المراجعة والملاحظات'} subtitle="Versioned workpapers + reviewer notes"/><form className="form-grid" onSubmit={createWorkpaper}><input name="title" placeholder="عنوان ورقة العمل" required/><select name="procedureId"><option value="">بدون إجراء</option>{procedures.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><textarea name="content" placeholder="التوثيق"/><textarea name="conclusion" placeholder="الاستنتاج الأولي"/><button>إنشاء ورقة عمل</button></form><div className="card-list">{workpapers.map((item) => <div className="list-card" key={item.id}><div><Badge tone={item.status === 'approved' || item.status === 'locked' ? 'ok' : 'neutral'}>{item.status}</Badge><strong>{item.title}</strong><small>v{String(item.current_version)} · {String(item.preparer ?? '')}</small></div><div className="row-actions"><button className="small-action" onClick={() => advanceWorkpaper(item)} disabled={item.status === 'locked'}>تقدم الحالة</button><button className="small-action ghost" onClick={() => addReviewNote(item)}>ملاحظة مراجع</button></div></div>)}</div></section> : null}

    {stage === 'misstatements' && <section className="panel-glass future-panel"><Badge tone="warn">PHASE B</Badge><h2>تجميع التحريفات والتسويات</h2><p>سيتم نقل ISA-450 style aggregation والتسويات المتوازنة من المحركات المرفقة بعد تثبيت GL والقيود. لن نعرض أرقامًا تجريبية كحقائق.</p></section>}

    {stage === 'reporting' && <ReportPanel engagementId={engagementId} commandCenter={commandCenter} perform={perform} refresh={refresh}/>} 
    {stage === 'archive' && <section className="panel-glass"><SectionHead title="قفل الأرشيف" subtitle="لا AI ولا Manager يستطيع القفل النهائي"/><div className="blocker-code-list">{commandCenter.readiness.blockers.map((item) => <span key={item.code}>{item.code}</span>)}</div><button className="danger-action" disabled={!commandCenter.readiness.readyForArchive || busy} onClick={() => transitionEngagement('archived','partner','Final archive lock after approved report and closure gates')}>قفل الأرشيف كشريك</button></section>}
  </div>;
}

function LifecycleActions({ status, onTransition, busy }: { status: string; onTransition: (to: string, role: string, reason?: string) => void; busy: boolean }) {
  const next: Record<string, { to: string; role: string; label: string }> = { draft:{to:'acceptance',role:'manager',label:'بدء القبول'}, acceptance:{to:'planning',role:'manager',label:'اعتماد الانتقال للتخطيط'}, planning:{to:'fieldwork',role:'manager',label:'بدء العمل الميداني'}, fieldwork:{to:'review',role:'manager',label:'الانتقال للمراجعة'}, review:{to:'reporting',role:'manager',label:'الانتقال للتقرير'}, reporting:{to:'archived',role:'partner',label:'قفل الأرشيف'} };
  const action = next[status]; if (!action) return <p className="muted">لا يوجد انتقال تلقائي متاح من هذه الحالة.</p>;
  return <button disabled={busy} onClick={() => onTransition(action.to, action.role, `Human transition from ${status}`)}>{action.label}</button>;
}
function PbcActions({ item, onMove }: { item: PbcRequest; onMove: (item: PbcRequest, to: string) => void }) { const next: Record<string,string> = { draft:'requested', requested:'received', received:'under_review', under_review:'accepted', rejected:'requested', need_clarification:'requested', overdue:'received' }; const to = next[item.status]; return to ? <button className="small-action" onClick={() => onMove(item,to)}>→ {to}</button> : null; }
function MappingRow({ line, mapping, onSave }: { line: Record<string,any>; mapping?: Record<string,any>; onSave: (id:string, statement:string)=>void }) { const [value,setValue] = useState(String(mapping?.statement_line ?? '')); return <div className="mapping-row"><div><strong>{String(line.account_code)} · {String(line.account_name)}</strong><small>{money(line.debit_minor)} / {money(line.credit_minor)}</small></div><input value={value} onChange={(event)=>setValue(event.target.value)} placeholder="Financial statement line"/><Badge tone={mapping?.status === 'approved' ? 'ok' : 'warn'}>{String(mapping?.status ?? 'unmapped')}</Badge><button disabled={!value.trim()} onClick={() => onSave(String(line.id),value)}>حفظ واعتماد</button></div>; }
function Score({ name,label }: { name:string; label:string }) { return <label className="score-field"><span>{label}</span><select name={name} defaultValue="3">{[1,2,3,4,5].map((value)=><option value={value} key={value}>{value}</option>)}</select></label>; }
function DataTable({ headers, rows }: { headers:string[]; rows:Array<Array<any>> }) { return <div className="table-wrap"><table><thead><tr>{headers.map((header)=><th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}>{row.map((cell,i)=><td key={i}>{String(cell)}</td>)}</tr>)}</tbody></table></div>; }
function ReportPanel({ engagementId, commandCenter, perform, refresh }: { engagementId:string; commandCenter:CommandCenter; perform:Perform; refresh:()=>Promise<void> }) { async function draft(){ await perform(async()=>{ await phaseAApi.createReport(engagementId,{ status:'draft', narrative:'مسودة توثيقية مبنية على snapshot الجاهزية؛ لا تمثل رأيًا نظاميًا.', createdBy:'pilot-senior', actorRole:'senior' }); await refresh(); },'تم إنشاء نسخة تقرير مرتبطة بلقطة جاهزية.'); } return <section className="panel-glass"><SectionHead title="التقرير والإقفال" subtitle="Snapshot قابل لإعادة البناء؛ الرأي النهائي بشري"/><div className="report-readiness"><strong>{commandCenter.readiness.score}/100</strong><span>{commandCenter.readiness.label}</span></div><button onClick={draft}>إنشاء نسخة تقرير Draft</button></section>; }
