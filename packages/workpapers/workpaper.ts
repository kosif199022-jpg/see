export type WorkpaperStatus =
  | 'draft'
  | 'prepared'
  | 'reviewer_open'
  | 'cleared'
  | 'approved'
  | 'locked';

export interface Workpaper {
  id: string;
  procedureId: string;
  evidenceIds: string[];
  conclusion?: string;
  status: WorkpaperStatus;
  version: number;
}

export function approveWorkpaper(w: Workpaper): Workpaper {
  if (!w.conclusion) throw new Error('Conclusion required');
  return { ...w, status: 'approved', version: w.version + 1 };
}
