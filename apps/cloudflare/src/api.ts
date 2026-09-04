import type {
  AuditRound,
  CommandCenter,
  CouncilRun,
  Engagement,
  JournalReviewItem,
  JournalReviewRun,
  PbcRequest,
  Procedure,
  ReportVersion,
  ReviewNote,
  SamplingRun,
  StandardReference,
  StandardUsage,
  TraceGraph,
  Workpaper,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAccessToken() {
  return sessionStorage.getItem('see_access_token') ?? '';
}

export function setAccessToken(token: string) {
  if (token) sessionStorage.setItem('see_access_token', token);
  else sessionStorage.removeItem('see_access_token');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    if (payload?.error && typeof payload.error === 'object') {
      throw new ApiError(payload.error.message || `HTTP ${response.status}`, payload.error.code || 'API_ERROR', response.status, payload.error.details);
    }
    throw new ApiError(typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`, 'API_ERROR', response.status);
  }
  return payload as T;
}

export async function downloadFile(path: string, filename: string) {
  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as any;
    const message = typeof payload?.error === 'object' ? payload.error.message : payload?.error;
    throw new Error(message || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export const phaseAApi = {
  engagements: () => api<{ engagements: Engagement[] }>('/api/v1/engagements'),
  createEngagement: (input: { name: string; clientName: string; periodEnd: string }) =>
    api<{ id: string; status: string }>('/api/v1/engagements', { method: 'POST', body: JSON.stringify(input) }),
  commandCenter: (engagementId: string) => api<CommandCenter>(`/api/v1/engagements/${engagementId}/command-center`),
  transitionEngagement: (engagementId: string, input: { to: string; actorRole: string; reason?: string; expectedStatus?: string }) =>
    api(`/api/v1/engagements/${engagementId}/transitions`, { method: 'POST', body: JSON.stringify(input) }),
  pbc: (engagementId: string) => api<{ requests: PbcRequest[] }>(`/api/v1/engagements/${engagementId}/pbc`),
  createPbc: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/pbc`, { method: 'POST', body: JSON.stringify(input) }),
  transitionPbc: (id: string, input: Record<string, unknown>) => api(`/api/v1/pbc/${id}/transitions`, { method: 'POST', body: JSON.stringify(input) }),
  closeRisk: (id: string, input: Record<string, unknown>) => api(`/api/v1/risks/${id}/close`, { method: 'POST', body: JSON.stringify(input) }),
  procedures: (engagementId: string) => api<{ procedures: Procedure[] }>(`/api/v1/engagements/${engagementId}/procedures`),
  createProcedure: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/procedures`, { method: 'POST', body: JSON.stringify(input) }),
  runProcedure: (id: string, input: Record<string, unknown>) => api(`/api/v1/procedures/${id}/runs`, { method: 'POST', body: JSON.stringify(input) }),
  workpapers: (engagementId: string) => api<{ workpapers: Workpaper[] }>(`/api/v1/engagements/${engagementId}/workpapers`),
  createWorkpaper: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/workpapers`, { method: 'POST', body: JSON.stringify(input) }),
  newWorkpaperVersion: (id: string, input: Record<string, unknown>) => api(`/api/v1/workpapers/${id}/versions`, { method: 'POST', body: JSON.stringify(input) }),
  transitionWorkpaper: (id: string, input: Record<string, unknown>) => api(`/api/v1/workpapers/${id}/transitions`, { method: 'POST', body: JSON.stringify(input) }),
  reviewNotes: (engagementId: string) => api<{ notes: ReviewNote[] }>(`/api/v1/engagements/${engagementId}/review-notes`),
  addReviewNote: (id: string, input: Record<string, unknown>) => api(`/api/v1/workpapers/${id}/review-notes`, { method: 'POST', body: JSON.stringify(input) }),
  clearReviewNote: (id: string, input: Record<string, unknown>) => api(`/api/v1/review-notes/${id}/clear`, { method: 'POST', body: JSON.stringify(input) }),
  journalReview: (engagementId: string) => api<{ run: JournalReviewRun | null; items: JournalReviewItem[] }>(`/api/v1/engagements/${engagementId}/journal-review`),
  createJournalReview: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/journal-review`, { method: 'POST', body: JSON.stringify(input) }),
  reviewJournalItem: (id: string, input: Record<string, unknown>) => api(`/api/v1/journal-review-items/${id}/decisions`, { method: 'POST', body: JSON.stringify(input) }),
  samplingRuns: (engagementId: string) => api<{ runs: SamplingRun[] }>(`/api/v1/engagements/${engagementId}/sampling-runs`),
  createSamplingRun: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/sampling-runs`, { method: 'POST', body: JSON.stringify(input) }),
  rounds: (engagementId: string) => api<{ rounds: AuditRound[] }>(`/api/v1/engagements/${engagementId}/rounds`),
  updateRound: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/rounds`, { method: 'POST', body: JSON.stringify(input) }),
  standards: () => api<{ standards: StandardReference[]; notice: string }>('/api/v1/standards'),
  standardsUsage: (engagementId: string) => api<{ usages: StandardUsage[] }>(`/api/v1/engagements/${engagementId}/standards-usage`),
  createStandardsUsage: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/standards-usage`, { method: 'POST', body: JSON.stringify(input) }),
  trace: (engagementId: string) => api<TraceGraph>(`/api/v1/engagements/${engagementId}/trace`),
  linkEvidence: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/evidence-links`, { method: 'POST', body: JSON.stringify(input) }),
  councilRuns: (engagementId: string) => api<{ runs: CouncilRun[] }>(`/api/v1/engagements/${engagementId}/council-runs`),
  createCouncilRun: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/council-runs`, { method: 'POST', body: JSON.stringify(input) }),
  transitionCouncil: (id: string, input: Record<string, unknown>) => api(`/api/v1/council-runs/${id}/transitions`, { method: 'POST', body: JSON.stringify(input) }),
  reports: (engagementId: string) => api<{ reports: ReportVersion[] }>(`/api/v1/engagements/${engagementId}/report-versions`),
  createReport: (engagementId: string, input: Record<string, unknown>) => api(`/api/v1/engagements/${engagementId}/report-versions`, { method: 'POST', body: JSON.stringify(input) }),
};
