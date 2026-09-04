import { normalizeArabicDigits } from './text-normalization.ts';

export const MONEY_ENGINE_VERSION = 'SEE-KOSIF-MONEY-v1' as const;

export function parseMoneyMinor(value: unknown, decimals = 2): bigint {
  if (typeof value === 'bigint') return value;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new RangeError('decimals must be an integer between 0 and 6');
  }
  if (value === null || value === undefined || value === '') return 0n;

  let raw = normalizeArabicDigits(value).trim();
  let negative = false;
  if (/^\(.*\)$/.test(raw)) {
    negative = true;
    raw = raw.slice(1, -1);
  }
  raw = raw
    .replace(/[\s\u00a0]/g, '')
    .replace(/٬/g, ',')
    .replace(/٫/g, '.')
    .replace(/[^0-9,.-]/g, '');

  if (raw.startsWith('-')) {
    negative = !negative;
    raw = raw.slice(1);
  }
  if (!raw) return 0n;

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  const lastSeparator = Math.max(lastComma, lastDot);
  let integerPart = raw;
  let fractionPart = '';

  if (lastSeparator >= 0) {
    const suffix = raw.slice(lastSeparator + 1).replace(/\D/g, '');
    const decimalCandidate = suffix.length > 0 && suffix.length <= decimals;
    if (decimalCandidate) {
      integerPart = raw.slice(0, lastSeparator);
      fractionPart = suffix;
    }
  }

  integerPart = integerPart.replace(/[,.]/g, '').replace(/\D/g, '') || '0';
  fractionPart = fractionPart.padEnd(decimals, '0').slice(0, decimals);

  const scale = 10n ** BigInt(decimals);
  const minor = BigInt(integerPart) * scale + BigInt(fractionPart || '0');
  return negative ? -minor : minor;
}

export function absoluteMinor(value: bigint): bigint {
  return value < 0n ? -value : value;
}
