export interface MaterialityInput {
  benchmark: bigint;
  percentage: number;
}

export interface MaterialityResult {
  amount: bigint;
  version: string;
}

export function calculateMateriality(input: MaterialityInput): MaterialityResult {
  const amount = (input.benchmark * BigInt(Math.round(input.percentage * 100))) / 10000n;
  return {
    amount,
    version: 'SEE-MATERIALITY-v1'
  };
}
