export const AUDIT_ROUNDS = Object.freeze([
  { code: 'A01', title: 'قبول الارتباط والاستقلال', gate: 'توثيق القبول، الاستقلال، تضارب المصالح ونطاق الارتباط.' },
  { code: 'A02', title: 'فهم المنشأة والبيئة', gate: 'توثيق النشاط والعمليات والنظم والحوكمة والأطراف ذات العلاقة.' },
  { code: 'A03', title: 'الأهمية النسبية', gate: 'اعتماد الأساس والنسبة وأهمية الأداء وحد التحريف التافه.' },
  { code: 'A04', title: 'تقييم المخاطر', gate: 'ربط مخاطر التحريف الجوهري بالتأكيدات والحسابات والإفصاحات.' },
  { code: 'A05', title: 'الضوابط والاختبارات', gate: 'تحديد الضوابط واختبار التصميم والتنفيذ والفعالية التشغيلية.' },
  { code: 'A06', title: 'الإجراءات الجوهرية', gate: 'تنفيذ التحليلات والتفاصيل والعينات وربط كل نتيجة بدليل.' },
  { code: 'A07', title: 'التقديرات والأحكام', gate: 'اختبار النماذج والافتراضات والبيانات والتحيز الإداري.' },
  { code: 'A08', title: 'الاستمرارية والأحداث اللاحقة', gate: 'تقييم التدفقات وخطط الإدارة والأحداث حتى تاريخ التقرير.' },
  { code: 'A09', title: 'الإكمال والتحريفات', gate: 'تجميع التحريفات والمراجعة التحليلية والإقرارات الختامية.' },
  { code: 'A10', title: 'التقرير ومراجعة الجودة', gate: 'تحديد الرأي والمسائل الرئيسية ومراجعة الشريك والاعتماد البشري.' },
] as const);

export type RoundCode = (typeof AUDIT_ROUNDS)[number]['code'];
export type RoundStatus = 'not_started' | 'in_progress' | 'attention' | 'complete';
export type RoundActorRole = 'partner' | 'manager' | 'senior' | 'junior' | 'quality_reviewer' | 'client' | 'ai_agent';

export type RoundDecisionInput = {
  status: RoundStatus;
  actorRole: RoundActorRole;
  actor: string;
  rationale: string;
};

export type RoundDecisionResult = { allowed: boolean; blockers: string[] };

export function isRoundCode(value: string): value is RoundCode {
  return AUDIT_ROUNDS.some((round) => round.code === value);
}

export function validateRoundDecision(input: RoundDecisionInput): RoundDecisionResult {
  const blockers: string[] = [];
  if (!input.actor.trim()) blockers.push('ROUND_ACTOR_REQUIRED');
  if (input.actorRole === 'ai_agent' || input.actorRole === 'client') blockers.push('ROUND_HUMAN_REQUIRED');
  if (input.status === 'complete' && !input.rationale.trim()) blockers.push('ROUND_COMPLETION_RATIONALE_REQUIRED');
  return { allowed: blockers.length === 0, blockers };
}
