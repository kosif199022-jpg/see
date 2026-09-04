export interface WorkpaperIndex {
  id: string;
  title: string;
  evidenceIds: string[];
  status: 'draft' | 'review' | 'approved';
}

export function indexWorkpaper(item: WorkpaperIndex) {
  return item;
}
