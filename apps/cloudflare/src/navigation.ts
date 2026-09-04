import type { PrimaryWorkspace } from './types';

export const PRIMARY_NAV: ReadonlyArray<{ id: PrimaryWorkspace; label: string; icon: string; description: string }> = [
  { id: 'home', label: 'الرئيسية', icon: '⌂', description: 'مركز القيادة والجاهزية' },
  { id: 'audit', label: 'المراجعة', icon: '✓', description: 'دورة المراجعة المهنية' },
  { id: 'analytics', label: 'التحليلات', icon: '⌁', description: 'مؤشرات حتمية قابلة للتتبع' },
  { id: 'council', label: 'مجلس AI', icon: '◇', description: 'مراجعة استشارية محكومة' },
  { id: 'more', label: 'المزيد', icon: '•••', description: 'الأدلة والتقارير والإعدادات' },
];

export const AUDIT_STAGE_LABELS: ReadonlyArray<[string, string]> = [
  ['acceptance', 'القبول والاستقلال'],
  ['planning', 'التخطيط'],
  ['pbc', 'طلبات PBC'],
  ['data_intake', 'استلام البيانات'],
  ['mapping', 'ربط الحسابات'],
  ['materiality', 'الأهمية النسبية'],
  ['risk', 'المخاطر والتأكيدات'],
  ['procedures', 'الإجراءات'],
  ['evidence', 'الأدلة'],
  ['workpapers', 'أوراق العمل'],
  ['review', 'المراجعة'],
  ['misstatements', 'التحريفات'],
  ['reporting', 'التقرير'],
  ['archive', 'الأرشيف'],
];

export const labelStage = (id: string) => AUDIT_STAGE_LABELS.find(([key]) => key === id)?.[1] ?? id;
