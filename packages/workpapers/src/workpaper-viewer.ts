export type WorkpaperView = {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'approved' | 'locked';
  linkedEvidence: string[];
  conclusion?: string;
};

export function createWorkpaperView(input: WorkpaperView) {
  return { ...input, createdAt: new Date().toISOString() };
}
