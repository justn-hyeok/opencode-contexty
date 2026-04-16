/**
 * Configuration types, defaults, and file operations
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface ContextyConfig {
  $schema: string;
  aasm: {
    mode: 'passive' | 'active';
    model?: string;
  };
}

export const DEFAULT_CONFIG: ContextyConfig = {
  $schema: 'https://unpkg.com/@ttalkkak-lab/opencode-contexty/schema.json',
  aasm: {
    mode: 'passive',
  },
};

export const OPENCODE_CONFIG_PATH = join(
  process.env.HOME || process.env.USERPROFILE || '~',
  '.config',
  'opencode',
  'opencode.json'
);

export const GLOBAL_CONTEXTY_CONFIG_PATH = join(
  process.env.HOME || process.env.USERPROFILE || '~',
  '.config',
  'opencode',
  'contexty.config.json'
);

export function writeConfig(config: ContextyConfig): string {
  const configDir = join(process.env.HOME || process.env.USERPROFILE || '~', '.config', 'opencode');
  mkdirSync(configDir, { recursive: true });

  const configPath = GLOBAL_CONTEXTY_CONFIG_PATH;
  const content = JSON.stringify(config, null, 2);
  writeFileSync(configPath, content + '\n', 'utf-8');
  return configPath;
}
