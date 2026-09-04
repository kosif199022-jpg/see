import type { ReactNode } from 'react';
import type { ReadinessBlocker } from '../types';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'ai' | 'evidence' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function BlockerList({ blockers }: { blockers: ReadinessBlocker[] }) {
  if (!blockers.length) return <div className="empty-inline">لا توجد بوابات مهنية مفتوحة في هذا العرض.</div>;
  return <div className="blocker-list">{blockers.map((item) => <div className="blocker" key={item.code}><span>!</span><div><strong>{item.code}</strong><p>{item.message}{item.count !== undefined ? ` · ${item.count}` : ''}</p></div></div>)}</div>;
}

export function SectionHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state compact"><div className="empty-orb">○</div><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}
