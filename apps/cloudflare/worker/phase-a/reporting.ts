import type { AuditActorRole } from '../../../../packages/domain/src/lifecycle';
import { buildCommandCenter } from './dashboard';
import { auditEventStatement, phaseAId, phaseANow } from './events';
import type { PhaseAEnv } from './types';

const respond = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const problem = (code: string, message: string, status = 400, details?: unknown) =>
  respond({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
async function jsonBody<T>(request: Request): Promise<T> { return (await request.json()) as T; }

export async function handleReportingRoute(request: Request, env: PhaseAEnv, path: string): Promise<Response | null> {
  const listMatch = path.match(/^\/api\/v1\/engagements\/([^/]+)\/report-versions$/);
  if (listMatch && request.method === 'GET') {
    const result = await env.DB.prepare(`
      SELECT id, engagement_id, version, status, readiness_snapshot_json, narrative, created_by, created_at, approved_at
      FROM report_versions WHERE engagement_id = ? ORDER BY version DESC
    `).bind(listMatch[1]).all();
    return respond({ reports: result.results ?? [] });
  }

  if (listMatch && request.method === 'POST') {
    const engagementId = listMatch[1];
    const input = await jsonBody<{ status?: 'draft' | 'approved'; narrative?: string; createdBy?: string; actorRole?: AuditActorRole }>(request);
    const commandCenter = await buildCommandCenter(env, engagementId);
    if (!commandCenter) return problem('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
    const requestedStatus = input.status === 'approved' ? 'approved' : 'draft';
    const professionalBlockers = commandCenter.readiness.blockers.filter((item) => item.code !== 'REPORT_NOT_APPROVED');
    if (requestedStatus === 'approved') {
      if (input.actorRole !== 'partner') return problem('REPORT_PARTNER_APPROVAL_REQUIRED', 'Partner approval is required for report approval', 409);
      if (professionalBlockers.length > 0) {
        return problem('REPORT_APPROVAL_BLOCKED', 'Report cannot be approved while professional blockers remain', 409, { blockers: professionalBlockers });
      }
    }
    const previous = await env.DB.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM report_versions WHERE engagement_id = ?')
      .bind(engagementId).first<{ version: number }>();
    const version = (previous?.version ?? 0) + 1;
    const id = phaseAId(); const at = phaseANow(); const actor = input.createdBy?.trim() || `pilot:${input.actorRole ?? 'senior'}`;
    const snapshot = { ...commandCenter.readiness, capturedAt: at, source: 'SEE command-center projection' };
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO report_versions
          (id, engagement_id, version, status, readiness_snapshot_json, narrative, created_by, created_at, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, engagementId, version, requestedStatus, JSON.stringify(snapshot), input.narrative?.trim() ?? '', actor, at, requestedStatus === 'approved' ? at : null),
      auditEventStatement(env, {
        engagementId, entityType: 'report_version', entityId: id,
        action: requestedStatus === 'approved' ? 'report.approved' : 'report.version_created', actor, occurredAt: at,
        payload: { version, status: requestedStatus, readinessMethod: commandCenter.readiness.method },
      }),
    ]);
    return respond({
      id,
      version,
      status: requestedStatus,
      readinessSnapshot: snapshot,
      opinionAuthority: 'human-only',
    }, 201);
  }

  return null;
}
