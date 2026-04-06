/// <reference types="bun-types" />

import { describe, expect, it } from 'bun:test';
import { MetricsCollector } from './collector';

function createCollector() {
  return new MetricsCollector('/tmp');
}

describe('MetricsCollector', () => {
  it('estimates tokens from message parts', () => {
    const collector = createCollector();

    const snapshot = collector.collect([
      {
        info: { id: 'm1', role: 'user' },
        parts: [{ type: 'text', content: 'aaaa' }],
      },
      {
        info: { id: 'm2', role: 'assistant' },
        parts: [{ type: 'text', content: 'bbbbbbbb' }],
      },
    ] as any);

    expect(snapshot.tokens.input).toBeGreaterThan(0);
    expect(snapshot.tokens.output).toBeGreaterThan(0);
  });

  it('deduplicates file metrics by path', () => {
    const collector = createCollector();

    const snapshot = collector.collect([
      {
        info: { id: 'm1', role: 'assistant' },
        parts: [
          { type: 'file', source: { path: 'src/a.ts' }, content: 'abcd' },
        ],
      },
      {
        info: { id: 'm2', role: 'assistant' },
        parts: [
          { type: 'file', source: { path: 'src/a.ts' }, content: 'abcdefgh' },
          { type: 'file', source: { path: 'src/b.ts' }, content: 'abc' },
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
        info: { id: 'm1', role: 'assistant' },
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
