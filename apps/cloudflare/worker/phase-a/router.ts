import { handleCouncilRoute } from './council';
import { buildCommandCenter } from './dashboard';
import { handleFieldworkRoute } from './fieldwork';
import { handleLifecycleRoute } from './lifecycle';
import { handlePbcRoute } from './pbc';
import { handleReportingRoute } from './reporting';
import { handleTraceRoute } from './trace';
import type { PhaseAEnv } from './types';

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function apiError(code: string, message: string, status = 400, details?: unknown) {
  return json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
}

export async function handlePhaseA(request: Request, env: PhaseAEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/v1/')) return null;

  const commandCenterMatch = path.match(/^\/api\/v1\/engagements\/([^/]+)\/command-center$/);
  if (commandCenterMatch && request.method === 'GET') {
    const result = await buildCommandCenter(env, commandCenterMatch[1]);
    return result ? json(result) : apiError('ENGAGEMENT_NOT_FOUND', 'Engagement not found', 404);
  }

  for (const handler of [
    handleLifecycleRoute,
    handlePbcRoute,
    handleFieldworkRoute,
    handleTraceRoute,
    handleCouncilRoute,
    handleReportingRoute,
  ]) {
    const response = await handler(request, env, path);
    if (response) return response;
  }

  return apiError('API_ROUTE_NOT_FOUND', 'API route not found', 404);
}
