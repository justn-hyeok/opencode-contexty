import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { runACPMWizard } from './acpm';

describe('runACPMWizard', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contexty-cli-acpm-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('creates a preset when ACPM is enabled', async () => {
    const promptInput = mock(async (question: string) => {
      if (question.includes('folder path')) return '/workspace';
      if (question.includes('preset name')) return 'team';
      return '';
    });
    const promptSelect = mock(async (_question: string, options: string[]) => options[1]);
    const promptYesNo = mock(async (question: string) => {
      if (question === 'Enable ACPM permissions?') return true;
      if (question === 'Add another folder permission?') return false;
      return true;
    });

    const presetName = await runACPMWizard(tempDir, { promptInput, promptSelect, promptYesNo });

    expect(presetName).toBe('team');

    const permissions = JSON.parse(
      await fs.readFile(path.join(tempDir, '.contexty', 'permissions.json'), 'utf8')
    );

    expect(permissions.presets).toHaveLength(1);
    expect(permissions.presets[0]).toEqual({
      name: 'team',
      folderPermissions: [
        {
          path: '/workspace',
          access: 'read-only',
        },
      ],
      toolPermissions: [
        { category: 'file-read', enabled: true },
        { category: 'file-write', enabled: true },
        { category: 'shell', enabled: true },
        { category: 'web', enabled: true },
        { category: 'lsp', enabled: true },
        { category: 'mcp', enabled: true },
      ],
      defaultPolicy: 'allow-all',
    });
  });

  it('does not create a preset when ACPM is disabled', async () => {
    const promptInput = mock(async () => '');
    const promptSelect = mock(async () => '');
    const promptYesNo = mock(async (question: string) => question !== 'Enable ACPM permissions?');

    const presetName = await runACPMWizard(tempDir, { promptInput, promptSelect, promptYesNo });

    expect(presetName).toBeNull();
    await expect(fs.readFile(path.join(tempDir, '.contexty', 'permissions.json'), 'utf8')).rejects.toThrow();
  });
});
