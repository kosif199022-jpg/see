export interface DemoAccount {
  code: string;
  name: string;
  type: string;
}

export function generateDemoAccounts(count: number): DemoAccount[] {
  return Array.from({ length: count }, (_, index) => ({
    code: String(1000 + index),
    name: `Demo Account ${index + 1}`,
    type: index % 2 === 0 ? 'asset' : 'liability'
  }));
}
