import legacy from './index';
import { persistKosifDemoRecords } from './phase-a/demo-kosif-seed';
import { apiError, handlePhaseA } from './phase-a/router';
import type { PhaseAEnv } from './phase-a/types';

function phaseAAuthRequired(request: Request, env: PhaseAEnv) {
  if (!env.APP_ACCESS_TOKEN) return false;
  return request.headers.get('Authorization') !== `Bearer ${env.APP_ACCESS_TOKEN}`;
}

export default {
  async fetch(request: Request, env: PhaseAEnv): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (path.startsWith('/api/v1/')) {
      if (phaseAAuthRequired(request, env)) {
        return apiError('UNAUTHORIZED', 'Unauthorized', 401);
      }
      try {
        const phaseA = await handlePhaseA(request, env);
        if (phaseA) return phaseA;
      } catch (cause) {
        console.error(cause);
        return apiError(
          'PHASE_A_INTERNAL_ERROR',
          cause instanceof Error ? cause.message : 'Unexpected server error',
          500,
        );
      }
    }

    const legacyResponse = await legacy.fetch(request, env);
    if (path === '/api/demo' && request.method === 'POST' && legacyResponse.ok) {
      try {
        const payload = await legacyResponse.clone().json() as { id?: string };
        if (payload.id) await persistKosifDemoRecords(env, payload.id);
      } catch (cause) {
        console.error(cause);
        return apiError(
          'DEMO_KOSIF_SEED_FAILED',
          cause instanceof Error ? cause.message : 'Failed to seed KOSIF demo records',
          500,
        );
      }
    }
    return legacyResponse;
  },
} satisfies ExportedHandler<PhaseAEnv>;
