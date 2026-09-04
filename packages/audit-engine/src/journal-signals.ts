export const JOURNAL_ENGINE_VERSION = 'SEE-JOURNAL-v1' as const;

export type JournalSignalCode =
  | 'MANUAL_ENTRY'
  | 'ROUNDED_AMOUNT'
  | 'PERIOD_END'
  | 'WEEKEND_ENTRY'
  | 'LOW_FREQUENCY_USER';

export type JournalSignal = {
  code: JournalSignalCode;
  severity: 'attention' | 'high';
  rationale: string;
};

export type JournalEntryInput = {
  id: string;
  entryDate?: string;
  debitMinor: bigint;
  creditMinor: bigint;
  isManual?: boolean;
  userName?: string;
};

export type JournalAnalysisContext = {
  periodEnd?: string;
  lowFrequencyUsers?: readonly string[];
  weekendDays?: readonly number[];
};

export type JournalAnalysisResult = {
  signals: JournalSignal[];
  authority: 'indicator';
  engineVersion: typeof JOURNAL_ENGINE_VERSION;
};

function absolute(value: bigint) {
  return value < 0n ? -value : value;
}

function effectiveAmount(entry: JournalEntryInput): bigint {
  const debit = absolute(entry.debitMinor);
  const credit = absolute(entry.creditMinor);
  return debit > credit ? debit : credit;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function analyzeJournalEntry(
  entry: JournalEntryInput,
  context: JournalAnalysisContext = {},
): JournalAnalysisResult {
  const signals: JournalSignal[] = [];

  if (entry.isManual === true) {
    signals.push({
      code: 'MANUAL_ENTRY',
      severity: 'attention',
      rationale: 'القيد موسوم كقيد يدوي ويستلزم تقييم المراجع للسياق والاعتماد.',
    });
  }

  const amount = effectiveAmount(entry);
  if (amount >= 100000n && amount % 10000n === 0n) {
    signals.push({
      code: 'ROUNDED_AMOUNT',
      severity: 'attention',
      rationale: 'المبلغ كبير نسبيًا وينتهي بقيمة مستديرة وفق قاعدة الفحص الحتمية.',
    });
  }

  if (isIsoDate(entry.entryDate) && context.periodEnd && entry.entryDate === context.periodEnd) {
    signals.push({
      code: 'PERIOD_END',
      severity: 'high',
      rationale: 'تاريخ القيد يطابق تاريخ نهاية الفترة المحدد للمهمة.',
    });
  }

  if (isIsoDate(entry.entryDate)) {
    const day = new Date(`${entry.entryDate}T00:00:00Z`).getUTCDay();
    const configuredWeekend = context.weekendDays ?? [5, 6];
    if (configuredWeekend.includes(day)) {
      signals.push({
        code: 'WEEKEND_ENTRY',
        severity: 'attention',
        rationale: 'تاريخ القيد يقع ضمن أيام نهاية الأسبوع المهيأة لمحرك الفحص.',
      });
    }
  }

  if (entry.userName && context.lowFrequencyUsers?.includes(entry.userName)) {
    signals.push({
      code: 'LOW_FREQUENCY_USER',
      severity: 'attention',
      rationale: 'منشئ القيد موجود ضمن قائمة المستخدمين منخفضي التكرار التي زودها سياق التحليل.',
    });
  }

  return {
    signals,
    authority: 'indicator',
    engineVersion: JOURNAL_ENGINE_VERSION,
  };
}
