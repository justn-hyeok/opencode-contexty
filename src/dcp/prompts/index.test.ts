import { describe, expect, test } from 'bun:test';
import { buildProtectedToolsExtension, getCompressToolExtension, renderSystemPrompt } from './index';
import type { DCPConfig } from '../types';

const baseConfig: DCPConfig = {
  enabled: true,
  debug: false,
  pruneNotification: 'off',
  pruneNotificationType: 'chat',
  commands: { enabled: false, protectedTools: [] },
  manualMode: { enabled: false, automaticStrategies: false },
  turnProtection: { enabled: false, turns: 0 },
  experimental: { allowSubAgents: false, customPrompts: false },
  protectedFilePatterns: ['src/secure/**'],
  compress: {
    mode: 'range',
    permission: 'ask',
    showCompression: true,
    summaryBuffer: false,
    maxContextLimit: 100,
    minContextLimit: 10,
    nudgeFrequency: 0,
    iterationNudgeThreshold: 0,
    nudgeForce: 'soft',
    protectedTools: ['custom-protect'],
    protectUserMessages: true,
  },
  strategies: {
    deduplication: { enabled: false, protectedTools: [] },
    purgeErrors: { enabled: false, turns: 0, protectedTools: [] },
  },
};

describe('dcp prompts', () => {
  test('renderSystemPrompt with default config contains compress text', () => {
    const prompt = renderSystemPrompt(baseConfig);

    expect(prompt).toContain('compress tool');
  });

  test('renderSystemPrompt with range mode contains range boundary ids', () => {
    const prompt = renderSystemPrompt(baseConfig);

    expect(prompt).toContain('range');
    expect(prompt).toContain('startId');
    expect(prompt).toContain('endId');
  });

  test('renderSystemPrompt with message mode contains messageId', () => {
    const prompt = renderSystemPrompt({
      ...baseConfig,
      compress: { ...baseConfig.compress, mode: 'message' },
    });

    expect(prompt).toContain('messageId');
  });

  test('buildProtectedToolsExtension contains protected tool names', () => {
    const extension = buildProtectedToolsExtension(baseConfig);

    expect(extension).toContain('task');
    expect(extension).toContain('custom-protect');
    expect(extension).toContain('src/secure/**');
  });

  test('getCompressToolExtension range contains range instructions', () => {
    const extension = getCompressToolExtension('range');

    expect(extension).toContain('startId');
    expect(extension).toContain('endId');
    expect(extension).toContain('(bN)');
  });
});
