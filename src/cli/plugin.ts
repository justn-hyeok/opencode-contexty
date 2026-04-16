/**
 * OpenCode plugin registration
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { OPENCODE_CONFIG_PATH } from './config.js';
import { success, info, warn } from './ui.js';

const PLUGIN_NAME = '@ttalkkak-lab/opencode-contexty';

const COMMANDS: Record<string, { description: string; template: string }> = {
  'agent-active': {
    description: 'Enable AASM active supervision',
    template: "Call the 'aasm' tool with argument { \"mode\": \"active\" }.",
  },
  'agent-passive': {
    description: 'Disable AASM supervision (passive mode)',
    template: "Call the 'aasm' tool with argument { \"mode\": \"passive\" }.",
  },
  'agent-status': {
    description: 'Check AASM status',
    template: "Call the 'aasm' tool with argument { \"mode\": \"status\" }.",
  },
  'ctx': {
    description: 'Show context window usage stats',
    template: '',
  },
  'agent-review': {
    description: 'Generate AASM anti-pattern review report across sessions',
    template: 'Immediately call the \'aasm\' tool with argument { "mode": "review" }. If the user supplied a numeric argument, include it as "limit" (5-100). Do not ask planning questions.',
  },
  'aasm': {
    description: 'AASM command hub (status/active/passive/review)',
    template: 'Call the \'aasm\' tool. Map subcommands: active/passive/status/review to { "mode": "..." }. For review, pass "limit" if a numeric arg exists (5-100).',
  },
  'ban': {
    description: 'Blacklist tool parts matching a file or directory path to exclude them from future context loads',
    template: 'Do nothing. This command is intercepted and handled by the plugin runtime before reaching you.',
  },
};

function getCommandsDir(): string {
  return join(dirname(OPENCODE_CONFIG_PATH), 'commands');
}

function generateCommandMarkdown(name: string, cmd: { description: string; template: string }): string {
  const lines = [
    '---',
    `description: ${cmd.description}`,
    '---',
    '',
  ];

  if (cmd.template) {
    lines.push(cmd.template);
  } else {
    lines.push(`The /${name} command is handled by the plugin runtime.`);
  }

  lines.push('');
  return lines.join('\n');
}

function installCommands(): boolean {
  const commandsDir = getCommandsDir();

  try {
    mkdirSync(commandsDir, { recursive: true });

    for (const [name, cmd] of Object.entries(COMMANDS)) {
      const filePath = join(commandsDir, `${name}.md`);
      const content = generateCommandMarkdown(name, cmd);
      writeFileSync(filePath, content, 'utf-8');
    }

    success(`Installed ${Object.keys(COMMANDS).length} commands to ${commandsDir}`);
    return true;
  } catch (e) {
    warn(`Could not install commands: ${e}`);
    return false;
  }
}

export function uninstallCommands(): boolean {
  const commandsDir = getCommandsDir();

  try {
    if (!existsSync(commandsDir)) {
      return true;
    }

    for (const name of Object.keys(COMMANDS)) {
      const filePath = join(commandsDir, `${name}.md`);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    info(`Removed commands from ${commandsDir}`);
    return true;
  } catch (e) {
    warn(`Could not remove commands: ${e}`);
    return false;
  }
}

export function registerPlugin(): boolean {
  try {
    if (!existsSync(OPENCODE_CONFIG_PATH)) {
      warn(`OpenCode config not found at ${OPENCODE_CONFIG_PATH}`);
      info('You may need to manually add the plugin to your opencode.json');
      return false;
    }

    const opencodeConfig = JSON.parse(readFileSync(OPENCODE_CONFIG_PATH, 'utf-8'));

    if (!opencodeConfig.plugin) {
      opencodeConfig.plugin = [];
    }

    let needsWrite = false;

    if (!opencodeConfig.plugin.includes(PLUGIN_NAME)) {
      opencodeConfig.plugin.push(PLUGIN_NAME);
      needsWrite = true;
    }

    if (needsWrite) {
      writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(opencodeConfig, null, 2) + '\n', 'utf-8');
      success(`Registered plugin in ${OPENCODE_CONFIG_PATH}`);
    } else {
      info('Plugin already registered in opencode.json');
    }

    installCommands();

    return true;
  } catch (e) {
    warn(`Could not update OpenCode config: ${e}`);
    return false;
  }
}
