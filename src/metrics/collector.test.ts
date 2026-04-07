/// <reference types="bun-types" />

import { describe, expect, it } from 'bun:test';
import { MetricsCollector } from './collector';

function createCollector() {
  return new MetricsCollector('/tmp');
}

describe('MetricsCollector', () => {
  it('estimates user tokens from text parts', () => {
    const collector = createCollector();

    const snapshot = collector.collect([
      {
        info: { id: 'm1', role: 'user' },
        parts: [{ type: 'text', text: 'aaaa' }],
      },
      {
        info: {
          id: 'm2',
          role: 'assistant',
          tokens: {
            input: 100,
            output: 50,
            reasoning: 10,
            cache: { read: 5, write: 2 },
          },
        },
        parts: [{ type: 'text', text: 'bbbbbbbb' }],
      },
    ] as any);

    expect(snapshot.tokens.input).toBeGreaterThan(0);
    expect(snapshot.tokens).toEqual({
      input: 101,
      output: 50,
      reasoning: 10,
      cacheRead: 5,
      cacheWrite: 2,
    });
  });

  it('reads assistant tokens directly from message info', () => {
    const collector = createCollector();

    const snapshot = collector.collect([
      {
        info: {
          id: 'm2',
          role: 'assistant',
          tokens: {
            input: 100,
            output: 50,
            reasoning: 10,
            cache: { read: 5, write: 2 },
          },
        },
        parts: [{ type: 'text', text: 'response text' }],
      },
    ] as any);

    expect(snapshot.tokens).toEqual({
      input: 100,
      output: 50,
      reasoning: 10,
      cacheRead: 5,
      cacheWrite: 2,
    });
  });

  it('deduplicates file metrics by path', () => {
    const collector = createCollector();

    const snapshot = collector.collect([
      {
        info: {
          id: 'm1',
          role: 'assistant',
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
        parts: [
          { type: 'file', source: { path: 'src/a.ts', text: { value: 'abcd' } } },
        ],
      },
      {
        info: {
          id: 'm2',
          role: 'assistant',
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
        parts: [
          { type: 'file', source: { path: 'src/a.ts', text: { value: 'abcdefgh' } } },
          { type: 'file', source: { path: 'src/b.ts', text: { value: 'abc' } } },
        ],
      },
    ] as any);

    expect(snapshot.files).toEqual([
      { path: 'src/a.ts', tokenEstimate: 3, role: 'assistant' },
      { path: 'src/b.ts', tokenEstimate: 1, role: 'assistant' },
    ]);
  });

  it('counts completed and error tools', () => {
    const collector = createCollector();

    const snapshot = collector.collect([
      {
        info: {
          id: 'm1',
          role: 'assistant',
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
        parts: [
          { type: 'tool', tool: 'search', state: { status: 'completed' } },
          { type: 'tool', tool: 'search', state: { status: 'error' } },
          { type: 'tool', tool: 'search', state: { status: 'running' } },
          { type: 'tool', tool: 'lint', state: { status: 'completed' } },
        ],
      },
    ] as any);

    expect(snapshot.tools).toEqual([
      { name: 'search', count: 2, successCount: 1, failCount: 1 },
      { name: 'lint', count: 1, successCount: 1, failCount: 0 },
    ]);
  });

  it('returns empty metrics for empty messages', () => {
    const collector = createCollector();

    const snapshot = collector.collect([]);

    expect(snapshot.tokens).toEqual({
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    });
    expect(snapshot.files).toEqual([]);
    expect(snapshot.tools).toEqual([]);
    expect(snapshot.acpm).toEqual({
      activePreset: null,
      allowCount: 0,
      denyCount: 0,
      sanitizeCount: 0,
      deniedByCategory: {},
      folderAccessDistribution: {
        denied: 0,
        'read-only': 0,
        'read-write': 0,
      },
      toolCategoryStatus: [],
    });
  });
});
