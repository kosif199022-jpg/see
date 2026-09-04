import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DESKTOP_MODULES,
  MOBILE_GROUPS,
  workspaceForDesktopModule,
  type DesktopModuleId,
} from '../navigation';
import type { Engagement, PrimaryWorkspace, ReadinessBlocker } from '../types';

const THEMES = [
  { id: 'light', label: 'فاتح' },
  { id: 'dark', label: 'داكن' },
] as const;

type ThemeId = (typeof THEMES)[number]['id'];

const DEFAULT_MODULE: Record<PrimaryWorkspace, DesktopModuleId> = {
  home: 'command-center',
  audit: 'data',
  analytics: 'journal',
  council: 'council',
  more: 'evidence',
};

export function AppShell({
  active,
  onNavigate,
  engagements,
  selectedId,
  onSelectEngagement,
  onCreateDemo,
  busy,
  blockers,
  children,
}: {
  active: PrimaryWorkspace;
  onNavigate: (value: PrimaryWorkspace) => void;
  engagements: Engagement[];
  selectedId: string;
  onSelectEngagement: (id: string) => void;
  onCreateDemo: () => void;
  busy: boolean;
  blockers: ReadinessBlocker[];
  children: ReactNode;
}) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<DesktopModuleId>(() => DEFAULT_MODULE[active]);
  const [theme, setTheme] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('see_theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('see_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (workspaceForDesktopModule(activeModule) !== active) {
      setActiveModule(DEFAULT_MODULE[active]);
    }
  }, [active, activeModule]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
        setAlertsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const commands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DESKTOP_MODULES.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle));
  }, [query]);
  const selected = engagements.find((item) => item.id === selectedId);
  const activeModuleMeta = DESKTOP_MODULES.find((item) => item.id === activeModule) ?? DESKTOP_MODULES[0];

  function cycleTheme() {
    setTheme((value) => (value === 'light' ? 'dark' : 'light'));
  }

  function goGroup(id: PrimaryWorkspace) {
    setActiveModule(DEFAULT_MODULE[id]);
    onNavigate(id);
    setCommandOpen(false);
    setQuery('');
  }

  function goModule(id: DesktopModuleId) {
    setActiveModule(id);
    onNavigate(workspaceForDesktopModule(id));
    setCommandOpen(false);
    setQuery('');
  }

  return <div className="app-shell unified-shell">
    <aside className="command-rail">
      <div className="brand"><span className="brand-mark">S</span><div><strong>SEE</strong><small>Audit Operating System</small></div></div>
      <div className="rail-context"><span className="live-dot"/><div><small>المهمة الحالية</small><strong>{selected?.name || 'لم تحدد مهمة'}</strong></div></div>
      <nav className="primary-nav desktop-professional-nav" aria-label="وحدات المراجعة المهنية">
        {DESKTOP_MODULES.map((item) => <button key={item.id} className={activeModule === item.id ? 'active' : ''} aria-current={activeModule === item.id ? 'page' : undefined} onClick={() => goModule(item.id)}><i>{item.icon}</i><span><b>{item.label}</b><small>{item.description}</small></span></button>)}
      </nav>
      <div className="rail-footer"><span>Evidence before conclusion</span><small>Human approval is mandatory</small></div>
    </aside>

    <main className="main-surface" id="main-content" tabIndex={-1}>
      <header className="global-topbar">
        <div className="mobile-brand"><span className="brand-mark">S</span><b>SEE</b></div>
        <div className="topbar-context">
          <span className="topbar-eyebrow">{activeModuleMeta.label}</span>
          <div className="engagement-picker"><label htmlFor="engagement-select">المهمة</label><select id="engagement-select" value={selectedId} onChange={(event) => onSelectEngagement(event.target.value)}><option value="">اختر مهمة</option>{engagements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        </div>
        <div className="top-tools">
          <button className="tool-button search-tool" onClick={() => setCommandOpen(true)} aria-label="فتح لوحة الأوامر"><span>بحث سريع</span><kbd>⌘K</kbd></button>
          <button className="tool-button icon-only" onClick={cycleTheme} aria-label={`تغيير المظهر — الحالي ${THEMES.find((item) => item.id === theme)?.label}`}>{theme === 'light' ? '☾' : '☀'}</button>
          <div className="popover-wrap"><button className="tool-button icon-only" onClick={() => setAlertsOpen((value) => !value)} aria-label="بوابات المراجعة">◎{blockers.length > 0 && <em>{Math.min(99, blockers.length)}</em>}</button>{alertsOpen && <div className="notification-popover"><div className="popover-head"><strong>بوابات المراجعة</strong><button onClick={() => setAlertsOpen(false)}>إغلاق</button></div>{blockers.length ? blockers.slice(0, 6).map((item) => <div className="notification" key={item.code}><i>!</i><div><b>{item.code}</b><span>{item.message}</span></div></div>) : <p className="muted">لا توجد بوابات مفتوحة في هذا العرض.</p>}</div>}</div>
          <button className="primary-action" onClick={onCreateDemo} disabled={busy}>Demo</button>
        </div>
      </header>
      <div className="content-surface">{children}</div>
    </main>

    <nav className="mobile-bottom-nav" aria-label="التنقل على الجوال">{MOBILE_GROUPS.map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined} onClick={() => goGroup(item.id)}><i>{item.icon}</i><span>{item.label}</span></button>)}</nav>

    {commandOpen && <div className="command-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCommandOpen(false)}><div className="command-dialog" role="dialog" aria-modal="true" aria-label="لوحة أوامر SEE"><div className="command-search"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن وحدة مراجعة أو وظيفة…"/><kbd>ESC</kbd></div><div className="command-results">{commands.map((item) => <button key={item.id} onClick={() => goModule(item.id)}><i>{item.icon}</i><div><strong>{item.label}</strong><small>{item.description}</small></div><span>←</span></button>)}{commands.length === 0 && <p className="muted command-empty">لا توجد نتيجة مطابقة.</p>}</div></div></div>}
  </div>;
}
