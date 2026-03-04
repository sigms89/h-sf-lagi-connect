import { describe, it, expect } from 'vitest';
import { parseJsonTransactions, parseTransactionText, isLikelyJson } from '@/lib/parseTransactions';

describe('isLikelyJson', () => {
  it('detects JSON array', () => {
    expect(isLikelyJson('[{"date":"2026-01-01"}]')).toBe(true);
  });
  it('detects JSON object', () => {
    expect(isLikelyJson('{"date":"2026-01-01","amount":-100}')).toBe(true);
  });
  it('rejects tab-separated bank data', () => {
    expect(isLikelyJson('23.02.2026\tHS Orka\t-45188\t1234567')).toBe(false);
  });
  it('detects JSON-like content with "date" and "amount" keys', () => {
    const input = `some header\n"date": "2026-01-01",\n"amount": -500,\n"description": "test"`;
    expect(isLikelyJson(input)).toBe(true);
  });
});

describe('parseJsonTransactions', () => {
  it('parses a valid JSON array', () => {
    const input = JSON.stringify([
      { date: '2026-01-15', description: 'Test', amount: -1000 },
      { date: '2026-01-16', description: 'Test2', amount: 500 },
    ]);
    const result = parseJsonTransactions(input);
    expect(result.transactions).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('recovers from truncated array (missing ])', () => {
    const input = `[
      {"date":"2026-01-15","description":"A","amount":-100},
      {"date":"2026-01-16","description":"B","amount":-200},
    `;
    const result = parseJsonTransactions(input);
    expect(result.transactions.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings?.length).toBeGreaterThan(0);
  });

  it('recovers from trailing comma + missing ]', () => {
    const input = `[
      {"date":"2026-01-15","description":"A","amount":-100},
      {"date":"2026-01-16","description":"B","amount":-200},`;
    const result = parseJsonTransactions(input);
    expect(result.transactions.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts objects from truly broken JSON via fallback', () => {
    const input = `[{"date":"2026-01-15","description":"A","amount":-100}, GARBAGE {"date":"2026-01-16","description":"B","amount":-200}`;
    const result = parseJsonTransactions(input);
    expect(result.transactions.length).toBeGreaterThanOrEqual(1);
  });

  it('parses NDJSON (one object per line)', () => {
    const input = `{"date":"2026-01-15","description":"A","amount":-100}
{"date":"2026-01-16","description":"B","amount":-200}
{"date":"2026-01-17","description":"C","amount":500}`;
    const result = parseJsonTransactions(input);
    expect(result.transactions).toHaveLength(3);
  });

  it('returns helpful error for completely invalid input', () => {
    const input = 'this is not json at all';
    const result = parseJsonTransactions(input);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Ógilt JSON');
  });

  it('handles single object (not array)', () => {
    const input = '{"date":"2026-01-15","description":"Solo","amount":-500}';
    const result = parseJsonTransactions(input);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].description).toBe('Solo');
  });

  it('handles empty input', () => {
    const result = parseJsonTransactions('');
    expect(result.transactions).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parseTransactionText', () => {
  it('caps errors at max limit for large broken input', () => {
    // Generate 500 lines of invalid data
    const lines = Array.from({ length: 500 }, (_, i) => `invalid-line-${i}`);
    const result = parseTransactionText(lines.join('\n'));
    expect(result.transactions).toHaveLength(0);
    // Should have capped errors + summary
    expect(result.errors.length).toBeLessThanOrEqual(201); // MAX_ERRORS + summary
    const lastError = result.errors[result.errors.length - 1];
    expect(lastError.message).toContain('til viðbótar');
  });

  it('parses valid tab-separated lines', () => {
    const input = '23.02.2026\tHS Orka\t-45.188\t1.234.567';
    const result = parseTransactionText(input);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(-45188);
  });
});
