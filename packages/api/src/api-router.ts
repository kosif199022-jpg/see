export type ApiRoute = {
  path: string;
  method: 'GET' | 'POST';
};

export const routes: ApiRoute[] = [
  { path: '/engagements', method: 'GET' },
  { path: '/audit/run', method: 'POST' },
  { path: '/reports', method: 'GET' }
];
