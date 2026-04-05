import fs from 'fs/promises';
import path from 'path';
import { isValidPermissionsFile, type PermissionsFile } from './types';

const permissionsFilePath = (baseDir: string): string => {
  return path.join(baseDir, '.contexty', 'permissions.json');
};

const ensureDir = async (baseDir: string): Promise<void> => {
  await fs.mkdir(path.join(baseDir, '.contexty'), { recursive: true });
};

const defaultPermissionsFile = (): PermissionsFile => {
  return { version: 1, presets: [] };
};

export class PermissionStorage {
  constructor(private readonly baseDir: string) {}

  async readPresets(): Promise<PermissionsFile> {
    const filePath = permissionsFilePath(this.baseDir);

    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);

      if (isValidPermissionsFile(parsed)) {
        return parsed;
      }

      return defaultPermissionsFile();
    } catch {
      return defaultPermissionsFile();
    }
  }

  async writePresets(data: PermissionsFile): Promise<void> {
    await ensureDir(this.baseDir);
    const filePath = permissionsFilePath(this.baseDir);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async ensurePermissionsFile(): Promise<void> {
    await ensureDir(this.baseDir);
    const filePath = permissionsFilePath(this.baseDir);

    try {
      await fs.access(filePath);
    } catch {
      await this.writePresets(defaultPermissionsFile());
    }
  }
}
