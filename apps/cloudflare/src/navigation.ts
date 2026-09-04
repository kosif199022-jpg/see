import type { PrimaryWorkspace } from './types';

export type DesktopModuleId =
  | 'command-center'
  | 'data'
  | 'planning'
  | 'risks'
  | 'journal'
  | 'workpapers'
  | 'pbc'
  | 'evidence'
  | 'standards'
  | 'rounds'
  | 'council'
  | 'reports'
  | 'knowledge';

export type DesktopModule = {
  id: DesktopModuleId;
  label: string;
  icon: string;
  description: string;
  group: PrimaryWorkspace;
};

export const DESKTOP_MODULES: ReadonlyArray<DesktopModule> = [
  { id: 'command-center', label: 'مركز القيادة', icon: '▦', description: 'الجاهزية والعوائق والخطوة التالية', group: 'home' },
  { id: 'data', label: 'البيانات والميزان', icon: '⇧', description: 'استيراد وتحليل ميزان المراجعة', group: 'audit' },
  { id: 'planning', label: 'التخطيط والأهمية', icon: '◎', description: 'الأهمية والتخطيط المهني', group: 'audit' },
  { id: 'risks', label: 'المخاطر والنتائج', icon: '△', description: 'المخاطر والاستجابات والنتائج', group: 'audit' },
  { id: 'journal', label: 'فحص قيود اليومية', icon: '↝', description: 'مؤشرات ISA 240 ومراجعة بشرية', group: 'analytics' },
  { id: 'workpapers', label: 'أوراق العمل', icon: '▤', description: 'إعداد ومراجعة وإصدارات', group: 'audit' },
  { id: 'pbc', label: 'طلبات المستندات PBC', icon: '□', description: 'طلبات واستلام ومراجعة الأدلة', group: 'audit' },
  { id: 'evidence', label: 'سجل الأدلة', icon: '◇', description: 'R2 والتتبع والروابط', group: 'more' },
  { id: 'standards', label: 'المعايير والمصادر', icon: '▥', description: 'مصادر وإصدارات وprovenance', group: 'more' },
  { id: 'rounds', label: 'الجولات العشر', icon: '↻', description: 'A01–A10 وبوابات التنفيذ', group: 'audit' },
  { id: 'council', label: 'مجلس المراجعين', icon: '◈', description: 'مراجعة استشارية متعددة الزوايا', group: 'council' },
  { id: 'reports', label: 'التقارير والتصدير', icon: '▧', description: 'إصدارات وتقارير واعتماد بشري', group: 'more' },
  { id: 'knowledge', label: 'مسارات المعرفة', icon: '▷', description: 'معرفة تطبيقية مرتبطة بالعمل', group: 'more' },
];

export const MOBILE_GROUPS: ReadonlyArray<{
  id: PrimaryWorkspace;
  label: string;
  icon: string;
  description: string;
  modules: readonly DesktopModuleId[];
}> = [
  { id: 'home', label: 'الرئيسية', icon: '⌂', description: 'مركز القيادة والجاهزية', modules: ['command-center'] },
  { id: 'audit', label: 'المراجعة', icon: '✓', description: 'دورة المراجعة المهنية', modules: ['data', 'planning', 'risks', 'workpapers', 'pbc', 'rounds'] },
  { id: 'analytics', label: 'التحليلات', icon: '⌁', description: 'تحليلات ومؤشرات حتمية', modules: ['journal'] },
  { id: 'council', label: 'المجلس', icon: '◇', description: 'مراجعة استشارية محكومة', modules: ['council'] },
  { id: 'more', label: 'المزيد', icon: '•••', description: 'الأدلة والمعايير والتقارير', modules: ['evidence', 'standards', 'reports', 'knowledge'] },
];

export const PRIMARY_NAV = MOBILE_GROUPS;

export function desktopModule(id: DesktopModuleId) {
  return DESKTOP_MODULES.find((item) => item.id === id)!;
}

export function workspaceForDesktopModule(id: DesktopModuleId): PrimaryWorkspace {
  return desktopModule(id).group;
}

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
