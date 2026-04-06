import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { PermissionStorage } from './storage';
import type { PermissionsFile } from './types';

describe('PermissionStorage', () => {
  let tempDir: string;
  let storage: PermissionStorage;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contexty-acpm-'));
    storage = new PermissionStorage(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('reads presets from an existing file', async () => {
    const storageDir = path.join(tempDir, '.contexty');
    await fs.mkdir(storageDir, { recursive: true });

    const data: PermissionsFile = {
      version: 1,
      presets: [
        {
          name: 'default',
          description: 'base policy',
          folderPermissions: [{ path: '/tmp', access: 'read-only' }],
          toolPermissions: [{ category: 'shell', enabled: false }],
          defaultPolicy: 'allow-all',
        },
      ],
    };

    await fs.writeFile(path.join(storageDir, 'permissions.json'), JSON.stringify(data, null, 2), 'utf8');

    expect(storage.readPresets()).resolves.toEqual(data);
  });

  it('returns the default value when the file does not exist', async () => {
    expect(storage.readPresets()).resolves.toEqual({ version: 1, presets: [] });
  });

  it('writes and reads presets round-trip', async () => {
    const data: PermissionsFile = {
      version: 1,
      presets: [
        {
          name: 'custom',
          folderPermissions: [{ path: '/workspace', access: 'read-write' }],
          toolPermissions: [{ category: 'file-read', enabled: true }],
          defaultPolicy: 'allow-all' as const,
        },
      ],
    };

    await storage.writePresets(data);

    expect(storage.readPresets()).resolves.toEqual(data);
  });

  it('creates the permissions file when ensuring storage', async () => {
    await storage.ensurePermissionsFile();

    const content = JSON.parse(await fs.readFile(path.join(tempDir, '.contexty', 'permissions.json'), 'utf8'));

    expect(content).toEqual({ version: 1, presets: [] });
  });

  describe('Per-session active preset', () => {
    it('writes and reads active preset round-trip', async () => {
      await storage.writeActivePreset('session-1', 'default');

      expect(storage.readActivePreset('session-1')).resolves.toBe('default');
    });

    it('returns undefined when no session preset file exists', async () => {
      expect(storage.readActivePreset('missing-session')).resolves.toBeUndefined();
    });

    it('creates the session active preset file in the session directory', async () => {
      await storage.writeActivePreset('session-2', 'alpha');

      const filePath = path.join(tempDir, '.contexty', 'sessions', 'session-2', 'active-preset.json');
      expect(fs.readFile(filePath, 'utf8')).resolves.toContain('"presetName": "alpha"');
    });
  });
});
