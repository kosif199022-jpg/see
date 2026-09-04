export interface DemoAccount {
  code: string;
  name: string;
  type: string;
}

export interface DemoCompanyDataset {
  companyName: string;
  accounts: DemoAccount[];
  fiscalYears: string[];
}

export function generateDemoCompany(accountCount = 5000): DemoCompanyDataset {
  const accounts = Array.from({ length: accountCount }, (_, index) => ({
    code: `ACC-${index + 1}`,
    name: `Demo Account ${index + 1}`,
    type: index % 2 === 0 ? 'asset' : 'liability'
  }));

  return {
    companyName: 'SEE Demo Enterprise',
    accounts,
    fiscalYears: ['2024', '2025', '2026']
  };
}
