import { describe, expect, test } from 'bun:test';

import {
  countTokens,
  estimateTokensBatch,
  extractToolContent,
  getTotalToolTokens,
} from './token-utils';

describe('token-utils', () => {
  test('countTokens returns a positive count for text', () => {
    expect(countTokens('Hello world')).toBeGreaterThan(0);
  });

  test('countTokens returns 0 for empty text', () => {
    expect(countTokens('')).toBe(0);
  });

  test('countTokens handles longer text reasonably', () => {
    const count = countTokens('a'.repeat(1000));
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(400);
  });

  test('estimateTokensBatch returns a positive count', () => {
    expect(estimateTokensBatch(['a', 'b'])).toBeGreaterThan(0);
  });

  test('extractToolContent returns input and output for tool parts', () => {
    expect(
      extractToolContent({
        type: 'tool',
        state: {
          status: 'completed',
          input: { query: 'hello' },
          output: { result: 'world' },
        },
      }),
    ).toEqual(['{"query":"hello"}', '{"result":"world"}']);
  });

  test('extractToolContent returns empty array for non-tool parts', () => {
    expect(extractToolContent({ type: 'text', text: 'hello' })).toEqual([]);
  });

  test('getTotalToolTokens returns 0 for empty map', () => {
    expect(getTotalToolTokens({ toolParameters: new Map() }, ['one'])).toBe(0);
  });

  test('getTotalToolTokens sums token counts', () => {
    const toolParameters = new Map([
      ['one', { tokenCount: 3 }],
      ['two', { tokenCount: 7 }],
    ]);
    expect(getTotalToolTokens({ toolParameters }, ['one', 'two', 'missing'])).toBe(10);
  });
});
