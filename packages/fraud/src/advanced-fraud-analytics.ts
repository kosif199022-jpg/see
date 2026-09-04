export type FraudPattern =
  | 'DUPLICATE_PAYMENT'
  | 'ROUND_AMOUNT'
  | 'PERIOD_END_ENTRY'
  | 'UNUSUAL_USER';

export interface FraudSignal {
  pattern: FraudPattern;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export function analyzeFraudSignals(patterns: FraudPattern[]): FraudSignal[] {
  return patterns.map(pattern => ({
    pattern,
    severity: 'MEDIUM',
    explanation: `Detected pattern: ${pattern}`
  }));
}
