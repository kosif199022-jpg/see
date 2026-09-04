export type FraudSignalType =
  | 'DUPLICATE_PAYMENT'
  | 'ROUND_AMOUNT'
  | 'PERIOD_END_ENTRY'
  | 'UNUSUAL_USER';

export interface FraudSignal {
  type: FraudSignalType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export function createFraudSignal(type: FraudSignalType, explanation: string): FraudSignal {
  return {
    type,
    severity: 'MEDIUM',
    explanation
  };
}
