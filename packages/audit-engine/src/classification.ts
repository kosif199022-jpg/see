import { normalizeAuditText } from './text-normalization.ts';

export const CLASSIFICATION_ENGINE_VERSION = 'SEE-KOSIF-CLASSIFICATION-v1' as const;

export type AccountClassificationInput = {
  code?: string;
  name: string;
  debitMinor: bigint;
  creditMinor: bigint;
};

export type AccountClassification = {
  category: string;
  normalBalance: 'debit' | 'credit' | 'mixed';
  standards: string[];
  assertions: string[];
  matchedSignals: string[];
  authority: 'indicator';
  engineVersion: typeof CLASSIFICATION_ENGINE_VERSION;
};

type Rule = Omit<AccountClassification, 'matchedSignals' | 'authority' | 'engineVersion'> & { keywords: string[] };

const RULES: readonly Rule[] = [
  { category: 'cash_and_banks', normalBalance: 'debit', standards: ['IAS 7', 'IFRS 9', 'ISA 505'], assertions: ['الوجود', 'الحقوق والالتزامات', 'العرض'], keywords: ['نقد', 'صندوق', 'بنك', 'cash', 'bank'] },
  { category: 'receivables', normalBalance: 'debit', standards: ['IFRS 9', 'IFRS 7', 'IAS 1'], assertions: ['الوجود', 'التقييم', 'القطع', 'الحقوق'], keywords: ['عملاء', 'ذمم مدينه', 'مدين', 'receivable'] },
  { category: 'inventory', normalBalance: 'debit', standards: ['IAS 2', 'ISA 501'], assertions: ['الوجود', 'الاكتمال', 'التقييم', 'الحقوق'], keywords: ['مخزون', 'بضاعه', 'مواد خام', 'inventory', 'stock'] },
  { category: 'property_plant_equipment', normalBalance: 'debit', standards: ['IAS 16', 'IAS 36'], assertions: ['الوجود', 'التقييم', 'الحقوق', 'العرض'], keywords: ['اصول ثابته', 'ممتلكات', 'معدات', 'مباني', 'ppe'] },
  { category: 'revenue', normalBalance: 'credit', standards: ['IFRS 15', 'IAS 1'], assertions: ['الحدوث', 'الاكتمال', 'الدقة', 'القطع', 'التصنيف'], keywords: ['ايراد', 'مبيعات', 'revenue', 'sales'] },
  { category: 'payables_and_liabilities', normalBalance: 'credit', standards: ['IAS 1', 'IFRS 9', 'IAS 37'], assertions: ['الاكتمال', 'التقييم', 'القطع', 'العرض'], keywords: ['مورد', 'دائن', 'التزام', 'payable', 'liability'] },
  { category: 'equity', normalBalance: 'credit', standards: ['IAS 1'], assertions: ['الوجود', 'الاكتمال', 'العرض'], keywords: ['راس المال', 'احتياطي', 'ارباح مبقاه', 'equity', 'capital'] },
  { category: 'expenses', normalBalance: 'debit', standards: ['IAS 1'], assertions: ['الحدوث', 'الاكتمال', 'الدقة', 'القطع', 'التصنيف'], keywords: ['مصروف', 'تكلفه', 'expense', 'cost'] },
];

export function classifyAccount(input: AccountClassificationInput): AccountClassification {
  const normalized = normalizeAuditText(`${input.code ?? ''} ${input.name}`);
  for (const rule of RULES) {
    const matchedSignals = rule.keywords.filter((keyword) => normalized.includes(normalizeAuditText(keyword)));
    if (matchedSignals.length) {
      return {
        category: rule.category,
        normalBalance: rule.normalBalance,
        standards: [...rule.standards],
        assertions: [...rule.assertions],
        matchedSignals,
        authority: 'indicator',
        engineVersion: CLASSIFICATION_ENGINE_VERSION,
      };
    }
  }
  return {
    category: 'unclassified',
    normalBalance: input.debitMinor > 0n && input.creditMinor === 0n ? 'debit' : input.creditMinor > 0n && input.debitMinor === 0n ? 'credit' : 'mixed',
    standards: [],
    assertions: [],
    matchedSignals: [],
    authority: 'indicator',
    engineVersion: CLASSIFICATION_ENGINE_VERSION,
  };
}
