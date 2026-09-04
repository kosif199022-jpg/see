import { useEffect, useState, type FormEvent } from 'react';
import { api, downloadFile, phaseAApi } from '../api';
import { canRequestReportApproval } from '../reporting-readiness';
import type { CommandCenter, LegacyDashboard, Perform, ReportVersion } from '../types';
import { Badge, EmptyState, SectionHead } from './Status';
import { EvidenceTrace } from './EvidenceTrace';

export function MoreWorkspace({
  engagementId,
  legacy,
  commandCenter,
  perform,
  refresh,
  accessToken,
  onSaveToken,
}: {
  engagementId: string;
  legacy: LegacyDashboard;
  commandCenter: CommandCenter;
  perform: Perform;
  refresh: () => Promise<void>;
  accessToken: string;
  onSaveToken: (value: string) => void;
}) {
  const [reports, setReports] = useState<ReportVersion[]>([]);
  const [tokenDraft, setTokenDraft] = useState(accessToken);
  const [loading, setLoading] = useState(false);
  const reportApprovalAvailable = canRequestReportApproval(commandCenter.readiness.blockers);

  async function reloadReports() {
    setLoading(true);
    try { setReports((await phaseAApi.reports(engagementId)).reports); }
    finally { setLoading(false); }
  }
  useEffect(() => { setTokenDraft(accessToken); reloadReports().catch(() => undefined); }, [engagementId, accessToken]);

  async function uploadEvidence(file: File) {
    const form = new FormData(); form.append('file', file);
    await perform(async () => { await api(`/api/engagements/${engagementId}/evidence`, { method: 'POST', body: form }); await refresh(); }, 'تم حفظ الدليل في R2 وتسجيل SHA-256.');
  }

  async function addFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await perform(async () => {
      await api(`/api/engagements/${engagementId}/findings`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          severity: form.get('severity'),
          description: form.get('description'),
          evidenceId: form.get('evidenceId') || undefined,
        }),
      });
      event.currentTarget.reset(); await refresh();
    }, 'تم تسجيل Finding وربطه بالمهمة.');
  }

  async function resolveFinding(id: string) {
    await perform(async () => {
      await api(`/api/findings/${id}/resolve`, { method: 'POST' });
      await refresh();
    }, 'تم حل الملاحظة وتحديث readiness.');
  }

  async function closeRisk(id: string) {
    const rationale = window.prompt('مبرر إغلاق الخطر — يجب أن يوضح العمل المنجز والمراجعة البشرية.');
    if (!rationale?.trim()) return;
    await perform(async () => {
      await phaseAApi.closeRisk(id, {
        actorRole: 'manager',
        actor: 'pilot-manager',
        rationale: rationale.trim(),
      });
      await refresh();
    }, 'تم إغلاق الخطر بقرار بشري ومبرر مسجل في audit trail.');
  }

  async function createReport(status: 'draft' | 'approved') {
    const narrative = window.prompt(status === 'approved' ? 'ملاحظات اعتماد التقرير' : 'ملاحظات نسخة التقرير') ?? '';
    await perform(async () => {
      await phaseAApi.createReport(engagementId, {
        status,
        narrative,
        createdBy: status === 'approved' ? 'pilot-partner' : 'pilot-senior',
        actorRole: status === 'approved' ? 'partner' : 'senior',
      });
      await Promise.all([reloadReports(), refresh()]);
    }, status === 'approved' ? 'تم إنشاء نسخة تقرير معتمدة بشريًا.' : 'تم إنشاء نسخة تقرير draft مع لقطة readiness.');
  }

  return <div className="workspace-view more-workspace">
    <div className="workspace-title"><div><Badge tone="neutral">CONTROL ROOM</Badge><h1>المزيد</h1><p>الأدلة، التقرير، سجل الأثر، وإعدادات الوصول في مساحة واحدة.</p></div><div className="method-card"><span>Readiness</span><strong>{commandCenter.readiness.score}/100</strong><small>{commandCenter.readiness.method}</small></div></div>

    <section className="two-column">
      <div className="panel-glass"><SectionHead title="الأدلة" subtitle="R2 object + D1 metadata + SHA-256"/><label className="drop-zone"><span>⇧</span><strong>رفع دليل</strong><small>حد الـpilot الحالي 10 MB للملف</small><input type="file" onChange={(event) => event.target.files?.[0] && uploadEvidence(event.target.files[0])}/></label><div className="card-list compact-list">{legacy.evidence.map((row) => <div className="list-card" key={String(row.id)}><div><Badge tone="evidence">{String(row.status ?? 'registered')}</Badge><strong>{String(row.name ?? row.id)}</strong><small>SHA {String(row.sha256 ?? '').slice(0, 16)}… · {String(row.size ?? 0)} bytes</small></div><button className="ghost-action" onClick={() => downloadFile(`/api/evidence/${String(row.id)}/download`, String(row.name ?? 'evidence'))}>تنزيل</button></div>)}{legacy.evidence.length === 0 && <p className="muted">لا توجد أدلة مسجلة.</p>}</div></div>

      <div className="panel-glass"><SectionHead title="النتائج والملاحظات" subtitle="Findings لا تُغلق تلقائيًا"/><form className="form-stack" onSubmit={addFinding}><label>العنوان<input name="title" required/></label><label>الشدة<select name="severity" defaultValue="medium"><option value="low">منخفض</option><option value="medium">متوسط</option><option value="high">مرتفع</option><option value="critical">حرج</option></select></label><label>الوصف<textarea name="description" required/></label><label>دليل مرتبط<select name="evidenceId"><option value="">بدون</option>{legacy.evidence.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name ?? row.id)}</option>)}</select></label><button>إضافة Finding</button></form><div className="card-list compact-list">{legacy.findings.map((row) => <div className="list-card" key={String(row.id)}><div><Badge tone={String(row.status) === 'resolved' ? 'ok' : String(row.severity) === 'high' || String(row.severity) === 'critical' ? 'bad' : 'warn'}>{String(row.status)}</Badge><strong>{String(row.title)}</strong><small>{String(row.severity)} · {String(row.description)}</small></div>{String(row.status) !== 'resolved' && <button className="small-action ghost" onClick={() => resolveFinding(String(row.id))}>حل الملاحظة</button>}</div>)}</div></div>
    </section>

    <section className="panel-glass"><SectionHead title="بوابات الإقفال المهنية" subtitle="إغلاق الخطر قرار بشري مستقل عن التقييم الحتمي"/><div className="card-list">{legacy.risks.map((risk) => <div className="list-card" key={String(risk.id)}><div><Badge tone={String(risk.status) === 'closed' ? 'ok' : String(risk.level) === 'high' ? 'bad' : 'warn'}>{String(risk.level)} · {String(risk.status)}</Badge><strong>{String(risk.title)}</strong><small>Score {String(risk.score)} · {String(risk.rationale)}</small></div>{String(risk.status) !== 'closed' && <button className="small-action" onClick={() => closeRisk(String(risk.id))}>إغلاق الخطر</button>}</div>)}{legacy.risks.length === 0 && <EmptyState title="لا توجد مخاطر مسجلة">أنشئ المخاطر من غرفة المراجعة ثم اربطها بإجراءات العمل.</EmptyState>}</div><p className="indicator-note">الإغلاق يتطلب Manager/Partner/Quality Reviewer ومبررًا مسجلًا؛ AI لا يملك صلاحية الإغلاق.</p></section>

    <EvidenceTrace engagementId={engagementId} legacy={legacy} perform={perform}/>

    <section className="two-column">
      <div className="panel-glass"><SectionHead title="مركز التقرير" subtitle="كل نسخة تحفظ readiness snapshot مستقل" action={<div className="button-row"><button className="ghost-action" onClick={() => createReport('draft')}>نسخة Draft</button><button onClick={() => createReport('approved')} disabled={!reportApprovalAvailable}>اعتماد Partner</button></div>}/>{loading ? <div className="loading-line">تحميل النسخ…</div> : reports.length ? <div className="card-list">{reports.map((report) => <div className="list-card" key={report.id}><div><Badge tone={report.status === 'approved' ? 'ok' : 'warn'}>{report.status}</Badge><strong>Report v{report.version}</strong><small>{String(report.created_at ?? '').slice(0, 16).replace('T', ' ')} · {String(report.created_by ?? '')}</small></div><span className="version-chip">v{report.version}</span></div>)}</div> : <EmptyState title="لا توجد نسخة تقرير">أنشئ draft بعد اكتمال ما يكفي من العمل لالتقاط حالة الجاهزية.</EmptyState>}<p className="indicator-note">SEE لا يصدر رأيًا نظاميًا تلقائيًا. اعتماد النسخة يتطلب Partner والبوابات المهنية.</p></div>

      <div className="panel-glass"><SectionHead title="إعدادات الوصول" subtitle="Session-only browser token + server-side authority"/><form className="form-stack" onSubmit={(event) => { event.preventDefault(); onSaveToken(tokenDraft.trim()); }}><label>APP_ACCESS_TOKEN<input type="password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="اتركه فارغًا إذا لم يفعّل على الخادم"/></label><button>حفظ للجلسة</button><button type="button" className="ghost-action" onClick={() => { setTokenDraft(''); onSaveToken(''); }}>مسح التوكن</button></form><div className="build-card"><span>SEE Phase A</span><strong>API v1 + compatibility</strong><small>React / Cloudflare Worker / D1 / R2</small></div></div>
    </section>

    <section className="panel-glass"><SectionHead title="سجل التدقيق" subtitle="أحداث Append-only من المهمة الحالية"/><div className="audit-timeline long">{legacy.events.length ? legacy.events.map((event) => <div className="timeline-row" key={String(event.id)}><i/><div><strong>{String(event.action)}</strong><span>{String(event.entity_type)} · {String(event.actor)}</span></div><time>{String(event.created_at).slice(0, 16).replace('T', ' ')}</time></div>) : <p className="muted">لا توجد أحداث.</p>}</div></section>
  </div>;
}
