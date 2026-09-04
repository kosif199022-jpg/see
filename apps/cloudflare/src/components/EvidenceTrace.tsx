import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { phaseAApi } from '../api';
import type { CouncilRun, LegacyDashboard, Perform, Procedure, ReportVersion, TraceGraph, Workpaper } from '../types';
import { Badge, EmptyState, SectionHead } from './Status';

type Target = { id: string; label: string; type: string };

export function EvidenceTrace({ engagementId, legacy, perform }: {
  engagementId: string;
  legacy: LegacyDashboard;
  perform: Perform;
}) {
  const [graph, setGraph] = useState<TraceGraph | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [reports, setReports] = useState<ReportVersion[]>([]);
  const [councilRuns, setCouncilRuns] = useState<CouncilRun[]>([]);
  const [view, setView] = useState<'list' | 'graph'>('list');
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState('finding');

  async function reload() {
    setLoading(true);
    try {
      const [trace, procedureData, workpaperData, reportData, councilData] = await Promise.all([
        phaseAApi.trace(engagementId),
        phaseAApi.procedures(engagementId),
        phaseAApi.workpapers(engagementId),
        phaseAApi.reports(engagementId),
        phaseAApi.councilRuns(engagementId),
      ]);
      setGraph(trace);
      setProcedures(procedureData.procedures);
      setWorkpapers(workpaperData.workpapers);
      setReports(reportData.reports);
      setCouncilRuns(councilData.runs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload().catch(() => undefined); }, [engagementId]);

  const targets = useMemo<Target[]>(() => {
    if (targetType === 'trial_balance_line') return legacy.trialBalance.lines.map((row) => ({ id: String(row.id), label: `${String(row.account_code ?? '')} ${String(row.account_name ?? '')}`.trim(), type: targetType }));
    if (targetType === 'risk') return legacy.risks.map((row) => ({ id: String(row.id), label: String(row.title ?? row.id), type: targetType }));
    if (targetType === 'finding') return legacy.findings.map((row) => ({ id: String(row.id), label: String(row.title ?? row.id), type: targetType }));
    if (targetType === 'procedure') return procedures.map((row) => ({ id: row.id, label: row.title, type: targetType }));
    if (targetType === 'workpaper') return workpapers.map((row) => ({ id: row.id, label: row.title, type: targetType }));
    if (targetType === 'report_version') return reports.map((row) => ({ id: row.id, label: `تقرير v${row.version}`, type: targetType }));
    if (targetType === 'council_run') return councilRuns.map((row) => ({ id: row.id, label: row.task, type: targetType }));
    return [];
  }, [targetType, legacy, procedures, workpapers, reports, councilRuns]);

  async function linkEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform(async () => {
      await phaseAApi.linkEvidence(engagementId, {
        evidenceId: form.get('evidenceId'),
        targetType: form.get('targetType'),
        targetId: form.get('targetId'),
        relation: form.get('relation') || 'supports',
        createdBy: 'pilot-reviewer',
      });
      await reload();
    }, 'تم ربط الدليل بالعنصر وتسجيل الأثر.');
  }

  const evidenceNodes = graph?.nodes.filter((node) => node.type === 'evidence') ?? [];
  const targetNodes = graph?.nodes.filter((node) => node.type !== 'evidence') ?? [];
  const nodeById = new Map((graph?.nodes ?? []).map((node) => [node.id, node]));

  return <section className="panel-glass evidence-trace">
    <SectionHead title="مستكشف أثر الأدلة" subtitle="Evidence → target links من D1 فقط" action={<div className="segmented"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>عرض كقائمة</button><button className={view === 'graph' ? 'active' : ''} onClick={() => setView('graph')}>شبكة</button></div>}/>
    <div className="trace-summary-row">
      <div><strong>{graph?.summary.evidenceNodes ?? 0}</strong><span>أدلة</span></div>
      <div><strong>{graph?.summary.linkedTargets ?? 0}</strong><span>عناصر مرتبطة</span></div>
      <div><strong>{graph?.summary.unlinkedEvidence ?? 0}</strong><span>أدلة غير مربوطة</span></div>
      <Badge tone="evidence">TRACEABLE</Badge>
    </div>

    <form className="trace-link-form" onSubmit={linkEvidence}>
      <label>الدليل<select name="evidenceId" required><option value="">اختر دليلًا</option>{legacy.evidence.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name ?? row.id)}</option>)}</select></label>
      <label>نوع الهدف<select name="targetType" value={targetType} onChange={(event) => setTargetType(event.target.value)}><option value="finding">Finding</option><option value="risk">Risk</option><option value="procedure">Procedure</option><option value="workpaper">Workpaper</option><option value="trial_balance_line">TB line</option><option value="report_version">Report</option><option value="council_run">Council</option></select></label>
      <label>الهدف<select name="targetId" required><option value="">اختر هدفًا</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}</select></label>
      <label>العلاقة<input name="relation" defaultValue="supports" required/></label>
      <button disabled={loading || legacy.evidence.length === 0 || targets.length === 0}>ربط الدليل</button>
    </form>

    {loading && <div className="loading-line">تحميل شبكة الأثر…</div>}
    {!loading && graph && view === 'list' && <div className="trace-list">{graph.edges.length ? graph.edges.map((edge) => {
      const from = nodeById.get(edge.from); const to = nodeById.get(edge.to);
      return <div className="trace-list-row" key={edge.id}><div className="trace-node evidence"><span>◇</span><strong>{from?.label ?? edge.from}</strong></div><div className="trace-relation"><span>←</span><small>{edge.relation}</small></div><div className="trace-node target"><span>○</span><strong>{to?.label ?? edge.to}</strong><small>{to?.type}</small></div></div>;
    }) : <EmptyState title="لا توجد روابط أثر بعد">اربط دليلًا بمخاطرة أو إجراء أو ورقة عمل لبدء الشبكة.</EmptyState>}</div>}

    {!loading && graph && view === 'graph' && <TraceSvg evidenceNodes={evidenceNodes} targetNodes={targetNodes} graph={graph}/>} 
  </section>;
}

function TraceSvg({ evidenceNodes, targetNodes, graph }: { evidenceNodes: TraceGraph['nodes']; targetNodes: TraceGraph['nodes']; graph: TraceGraph }) {
  const evidencePosition = new Map(evidenceNodes.map((node, index) => [node.id, { x: 120, y: 54 + index * 76 }]));
  const targetPosition = new Map(targetNodes.map((node, index) => [node.id, { x: 620, y: 54 + index * 76 }]));
  const height = Math.max(220, Math.max(evidenceNodes.length, targetNodes.length) * 76 + 32);
  return <div className="trace-svg-wrap" role="region" aria-label="رسم شبكة أثر الأدلة"><svg viewBox={`0 0 740 ${height}`} role="img" aria-label="روابط الأدلة بالعناصر المهنية">
    {graph.edges.map((edge) => { const from = evidencePosition.get(edge.from); const to = targetPosition.get(edge.to); return from && to ? <g key={edge.id}><line x1={from.x + 92} y1={from.y} x2={to.x - 92} y2={to.y}/><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}>{edge.relation}</text></g> : null; })}
    {evidenceNodes.map((node) => { const p = evidencePosition.get(node.id)!; return <g key={node.id} className="svg-node evidence"><rect x={p.x - 92} y={p.y - 24} width="184" height="48" rx="12"/><text x={p.x} y={p.y + 4} textAnchor="middle">{clip(node.label)}</text></g>; })}
    {targetNodes.map((node) => { const p = targetPosition.get(node.id)!; return <g key={node.id} className="svg-node target"><rect x={p.x - 92} y={p.y - 24} width="184" height="48" rx="12"/><text x={p.x} y={p.y + 4} textAnchor="middle">{clip(node.label)}</text></g>; })}
  </svg></div>;
}

function clip(value: string) { return value.length > 24 ? `${value.slice(0, 22)}…` : value; }
