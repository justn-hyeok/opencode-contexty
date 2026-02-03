/**
 * OpenCode plugin registration
 */

import { existsSync, writeFileSync, readFileSync } from 'fs';
import { OPENCODE_CONFIG_PATH } from './config.js';
import { success, info, warn } from './ui.js';

const PLUGIN_NAME = '@ttalkkak-lab/opencode-contexty';

export function registerPlugin(): boolean {
  try {
    if (!existsSync(OPENCODE_CONFIG_PATH)) {
      warn(`OpenCode config not found at ${OPENCODE_CONFIG_PATH}`);
      info('You may need to manually add the plugin to your opencode.json');
      return false;
    }

    const opencodeConfig = JSON.parse(readFileSync(OPENCODE_CONFIG_PATH, 'utf-8'));

    // Ensure plugin array exists
    if (!opencodeConfig.plugin) {
      opencodeConfig.plugin = [];
    }

    if (!opencodeConfig.plugin.includes(PLUGIN_NAME)) {
      opencodeConfig.plugin.push(PLUGIN_NAME);
      writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(opencodeConfig, null, 2) + '\n', 'utf-8');
      success(`Registered plugin in ${OPENCODE_CONFIG_PATH}`);
      return true;
    } else {
      info('Plugin already registered in opencode.json');
      return true;
    }
  } catch (e) {
    warn(`Could not update OpenCode config: ${e}`);
    return false;
  }
}
