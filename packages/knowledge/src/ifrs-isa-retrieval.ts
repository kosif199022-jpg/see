export interface StandardReference {
  standard: string;
  topic: string;
  relatedAccounts: string[];
  procedures: string[];
}

export const standards: StandardReference[] = [
  {
    standard: 'IAS 2',
    topic: 'Inventory Valuation',
    relatedAccounts: ['Inventory'],
    procedures: ['Physical count', 'NRV testing']
  },
  {
    standard: 'ISA 315',
    topic: 'Risk Assessment',
    relatedAccounts: [],
    procedures: ['Identify and assess risks']
  }
];

export function retrieveStandard(topic: string) {
  return standards.filter(item => item.topic === topic);
}
