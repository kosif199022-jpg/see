export const SAMPLING_ENGINE_VERSION = 'SEE-KOSIF-SAMPLING-v1' as const;

export type SamplingMethod = 'random' | 'systematic' | 'mus';
export type SamplingInput = {
  populationIds: string[];
  method: SamplingMethod;
  size: number;
  seed: number;
  amountsMinor?: Readonly<Record<string, bigint>>;
};
export type SamplingResult = {
  method: SamplingMethod;
  seed: number;
  populationSize: number;
  requestedSize: number;
  selectedIds: string[];
  engineVersion: typeof SAMPLING_ENGINE_VERSION;
};

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function validate(input: SamplingInput) {
  if (!Number.isInteger(input.size) || input.size < 1) throw new RangeError('size must be a positive integer');
  if (input.populationIds.length === 0) throw new RangeError('population must not be empty');
  if (input.size > input.populationIds.length) throw new RangeError('size cannot exceed population size');
  if (new Set(input.populationIds).size !== input.populationIds.length) throw new Error('population ids must be unique');
}

function randomSample(ids: string[], size: number, seed: number): string[] {
  const random = seededRandom(seed);
  const pool = [...ids];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, size);
}

function systematicSample(ids: string[], size: number, seed: number): string[] {
  const interval = ids.length / size;
  const random = seededRandom(seed);
  const start = random() * interval;
  const selected: string[] = [];
  for (let index = 0; index < size; index += 1) {
    const populationIndex = Math.min(ids.length - 1, Math.floor(start + index * interval));
    const id = ids[populationIndex];
    if (!selected.includes(id)) selected.push(id);
  }
  if (selected.length < size) {
    for (const id of ids) {
      if (!selected.includes(id)) selected.push(id);
      if (selected.length === size) break;
    }
  }
  return selected;
}

function musSample(input: SamplingInput): string[] {
  if (!input.amountsMinor) return systematicSample(input.populationIds, input.size, input.seed);
  const weighted = input.populationIds.map((id) => ({ id, amount: input.amountsMinor?.[id] ?? 0n })).filter((item) => item.amount > 0n);
  if (!weighted.length) return systematicSample(input.populationIds, input.size, input.seed);
  const total = weighted.reduce((sum, item) => sum + item.amount, 0n);
  const interval = total / BigInt(input.size);
  if (interval <= 0n) return systematicSample(input.populationIds, input.size, input.seed);
  const random = seededRandom(input.seed);
  const start = BigInt(Math.floor(random() * Number(interval > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : interval)));
  const selected: string[] = [];
  let cumulative = 0n;
  let target = start;
  let targetIndex = 0;
  for (const item of weighted) {
    cumulative += item.amount;
    while (targetIndex < input.size && cumulative > target) {
      if (!selected.includes(item.id)) selected.push(item.id);
      targetIndex += 1;
      target = start + interval * BigInt(targetIndex);
    }
    if (targetIndex >= input.size) break;
  }
  if (selected.length < input.size) {
    for (const id of input.populationIds) {
      if (!selected.includes(id)) selected.push(id);
      if (selected.length === input.size) break;
    }
  }
  return selected.slice(0, input.size);
}

export function selectSample(input: SamplingInput): SamplingResult {
  validate(input);
  const selectedIds = input.method === 'random'
    ? randomSample(input.populationIds, input.size, input.seed)
    : input.method === 'systematic'
      ? systematicSample(input.populationIds, input.size, input.seed)
      : musSample(input);
  return {
    method: input.method,
    seed: input.seed,
    populationSize: input.populationIds.length,
    requestedSize: input.size,
    selectedIds,
    engineVersion: SAMPLING_ENGINE_VERSION,
  };
}
