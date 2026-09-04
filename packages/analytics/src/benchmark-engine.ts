export interface BenchmarkResult {
  metric: string;
  value: number;
  benchmark: number;
}

export function compareBenchmark(metric: string, value: number, benchmark: number): BenchmarkResult {
  return { metric, value, benchmark };
}
