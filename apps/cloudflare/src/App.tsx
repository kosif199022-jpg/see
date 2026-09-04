import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, getAccessToken, phaseAApi, setAccessToken } from './api';
import { AnalyticsCenter } from './components/AnalyticsCenter';
import { AppShell } from './components/AppShell';
import { AuditWorkspace } from './components/AuditWorkspace';
import { CommandCenter } from './components/CommandCenter';
import { CouncilWorkspace } from './components/CouncilWorkspace';
import { MoreWorkspace } from './components/MoreWorkspace';
import type { CommandCenter as CommandCenterDto, Engagement, LegacyDashboard, PrimaryWorkspace } from './types';

function describeError(cause: unknown) {
  if (cause instanceof ApiError) {
    const blockers = Array.isArray(cause.details?.blockers) ? cause.details.blockers.join('، ') : '';
    return blockers ? `${cause.message}: ${blockers}` : cause.message;
  }
  return cause instanceof Error ? cause.message : 'حدث خطأ غير متوقع';
}

export default function App() {
  const [workspace, setWorkspace] = useState<PrimaryWorkspace>('home');
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [legacy, setLegacy] = useState<LegacyDashboard | null>(null);
  const [commandCenter, setCommandCenter] = useState<CommandCenterDto | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accessToken, setAccessTokenState] = useState(getAccessToken());

  async function refreshData(id: string) {
    const [legacyData, commandData] = await Promise.all([
      api<LegacyDashboard>(`/api/engagements/${id}/dashboard`),
      phaseAApi.commandCenter(id),
    ]);
    setLegacy(legacyData);
    setCommandCenter(commandData);
  }

  async function refreshEngagements(preferred?: string) {
    const result = await phaseAApi.engagements();
    setEngagements(result.engagements);
    const currentStillExists = result.engagements.some((item) => item.id === selectedId);
    const target = preferred || (currentStillExists ? selectedId : '') || result.engagements[0]?.id || '';
    setSelectedId(target);
    if (target) await refreshData(target);
    else { setLegacy(null); setCommandCenter(null); }
  }

  async function perform(action: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); }
    catch (cause) { setError(describeError(cause)); }
    finally { setBusy(false); }
  }

  useEffect(() => { refreshEngagements().catch((cause) => setError(describeError(cause))); }, []);

  async function createDemo() {
    await perform(async () => {
      const result = await api<{ id: string }>('/api/demo', { method: 'POST' });
      await refreshEngagements(result.id);
      setWorkspace('home');
    }, 'تم إنشاء مهمة Demo. البيانات موسومة تجريبية ولا تمثل استنتاج مراجعة.');
  }

  async function createEngagement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform(async () => {
      const result = await phaseAApi.createEngagement({
        name: String(form.get('name') ?? '').trim(),
        clientName: String(form.get('clientName') ?? '').trim(),
        periodEnd: String(form.get('periodEnd') ?? '').trim(),
      });
      event.currentTarget.reset();
      await refreshEngagements(result.id);
      setWorkspace('audit');
    }, 'تم إنشاء المهمة بحالة draft. ابدأ من القبول قبل التخطيط.');
  }

  async function selectEngagement(id: string) {
    setSelectedId(id); setNotice(''); setError('');
    if (!id) { setLegacy(null); setCommandCenter(null); return; }
    setLegacy(null); setCommandCenter(null);
    try { await refreshData(id); }
    catch (cause) { setError(describeError(cause)); }
  }

  function saveToken(value: string) {
    setAccessToken(value); setAccessTokenState(value);
    setNotice(value ? 'تم حفظ Access Token لهذه الجلسة.' : 'تم مسح Access Token من الجلسة.');
    setError('');
    if (selectedId) refreshData(selectedId).catch((cause) => setError(describeError(cause)));
  }

  const blockers = commandCenter?.readiness.blockers ?? [];

  return <AppShell
    active={workspace}
    onNavigate={setWorkspace}
    engagements={engagements}
    selectedId={selectedId}
    onSelectEngagement={(id) => { selectEngagement(id).catch((cause) => setError(describeError(cause))); }}
    onCreateDemo={() => { createDemo().catch((cause) => setError(describeError(cause))); }}
    busy={busy}
    blockers={blockers}
  >
    <div className="pilot-banner"><strong>SEE Phase A</strong><span>بيئة Pilot. لا ترفع بيانات عميل حقيقية قبل تفعيل APP_ACCESS_TOKEN وضوابط الوصول المناسبة.</span></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {notice && <div className="alert success" role="status">{notice}</div>}

    {!selectedId && <section className="onboarding panel-glass">
      <div className="onboarding-copy"><span className="overline">NEW ENGAGEMENT</span><h1>ابدأ مهمة مراجعة محكومة</h1><p>المهمة الجديدة تبدأ <b>draft</b> ثم تمر بالقبول والتخطيط والمراحل المهنية بدون قفزات صامتة.</p></div>
      <form className="engagement-form" onSubmit={createEngagement}>
        <label>اسم المهمة<input name="name" placeholder="مراجعة القوائم المالية 2026" required/></label>
        <label>العميل<input name="clientName" placeholder="اسم المنشأة" required/></label>
        <label>نهاية الفترة<input name="periodEnd" type="date" required/></label>
        <button disabled={busy}>إنشاء المهمة</button>
      </form>
      <div className="onboarding-note"><span>أو</span><button className="ghost-action" onClick={() => createDemo()}>إنشاء Demo تعليمي</button></div>
    </section>}

    {selectedId && (!legacy || !commandCenter) && <div className="loading-stage"><div className="loading-orb"/><strong>تحميل المهمة من D1…</strong></div>}

    {selectedId && legacy && commandCenter && <>
      {workspace === 'home' && <CommandCenter data={commandCenter} onNavigate={setWorkspace}/>} 
      {workspace === 'audit' && <AuditWorkspace engagementId={selectedId} legacy={legacy} commandCenter={commandCenter} perform={perform} refresh={() => refreshData(selectedId)} busy={busy}/>} 
      {workspace === 'analytics' && <AnalyticsCenter commandCenter={commandCenter} legacy={legacy}/>} 
      {workspace === 'council' && <CouncilWorkspace engagementId={selectedId} legacy={legacy} perform={perform}/>} 
      {workspace === 'more' && <MoreWorkspace engagementId={selectedId} legacy={legacy} commandCenter={commandCenter} perform={perform} refresh={() => refreshData(selectedId)} accessToken={accessToken} onSaveToken={saveToken}/>} 
    </>}
  </AppShell>;
}
