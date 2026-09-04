export type StandardReferenceStatus = 'current' | 'adopted' | 'transition' | 'historical' | 'training' | 'local';

export type StandardReference = {
  code: string;
  titleAr: string;
  sourceFamily: string;
  status: StandardReferenceStatus;
  version?: string;
  effectiveDate?: string;
  sourceNote?: string;
  note: string;
  authority: 'reference';
};

export const STANDARDS_LIBRARY: readonly StandardReference[] = Object.freeze([
  {
    code: 'IFRS 18',
    titleAr: 'العرض والإفصاح في القوائم المالية',
    sourceFamily: 'SOCPA 2025 / IFRS',
    status: 'adopted',
    effectiveDate: '2027-01-01',
    sourceNote: 'SOCPA 2025: 5، 13، 18',
    note: 'معتمد ضمن طبعة 2025، مع تاريخ سريان مستقبلي كما هو موسوم في المصدر المرجعي المستخدم في KOSIF.',
    authority: 'reference',
  },
  {
    code: 'IFRS 19',
    titleAr: 'المنشآت التابعة التي لا تخضع للمساءلة العامة: الإفصاحات',
    sourceFamily: 'SOCPA 2025 / IFRS',
    status: 'adopted',
    effectiveDate: '2027-01-01',
    sourceNote: 'SOCPA 2025: 5، 13، 41',
    note: 'مرجع إفصاح موسوم بالسريان والإصدار؛ لا يحل محل النص الرسمي.',
    authority: 'reference',
  },
  {
    code: 'IFRS 17',
    titleAr: 'عقود التأمين',
    sourceFamily: 'SOCPA 2025 / IFRS',
    status: 'current',
    effectiveDate: '2023-01-01',
    sourceNote: 'SOCPA 2025: 5، 13، 31',
    note: 'مرجع حالي وفق خريطة المصدر في KOSIF، مع وجوب الرجوع للنص الرسمي عند التطبيق.',
    authority: 'reference',
  },
  {
    code: 'IAS 8',
    titleAr: 'أساس إعداد القوائم المالية',
    sourceFamily: 'SOCPA 2025 / IFRS',
    status: 'transition',
    effectiveDate: '2027-01-01',
    sourceNote: 'SOCPA 2025: 6، 14، 21-22',
    note: 'مرجع انتقالي مرتبط بالتعديلات الاستتباعية لـIFRS 18 كما هو موثق في مصدر KOSIF.',
    authority: 'reference',
  },
  {
    code: 'SA-LIQ',
    titleAr: 'التقرير المالي على أساس التصفية',
    sourceFamily: 'SOCPA local',
    status: 'local',
    sourceNote: 'SOCPA 2025: 7، 18، 22، 1432+',
    note: 'مرجع سعودي محلي مستقل، ويجب فصله عن متطلبات IFRS الدولية في التفسير والاستخدام.',
    authority: 'reference',
  },
  {
    code: 'SA-ZAKAT',
    titleAr: 'معيار محاسبة الزكاة (المعدل)',
    sourceFamily: 'SOCPA local',
    status: 'local',
    sourceNote: 'SOCPA 2025: 7، 18-21، 1389+',
    note: 'مرجع سعودي محلي مكمل؛ لا يُعرض كجزء من عائلة IFRS الدولية.',
    authority: 'reference',
  },
]);

export function findStandard(code: string): StandardReference | undefined {
  return STANDARDS_LIBRARY.find((item) => item.code === code);
}
