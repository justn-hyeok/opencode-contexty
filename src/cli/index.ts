#!/usr/bin/env node
/**
 * OpenCode Contexty CLI
 * Interactive and non-interactive installer for contexty.config.json
 */

import { parseArgs } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { colors, log, info, error, success, banner } from './ui.js';
import { ContextyConfig, DEFAULT_CONFIG, writeConfig } from './config.js';
import { IDEType, installIDEExtension, getIDEDisplayName, isValidIDE } from './ide.js';
import { registerPlugin } from './plugin.js';
import { prompt, promptSelect, promptYesNo, promptNumber } from './prompt.js';

// ============================================================================
// CLI Arguments
// ============================================================================

interface CliValues {
  'no-tui': boolean;
  ide: string;
  'aasm-enabled': string;
  'aasm-mode': string;
  'enable-linting': string;
  'confidence-threshold': string;
  model: string;
  help: boolean;
  version: boolean;
}

const DEFAULT_CLI_VALUES: CliValues = {
  'no-tui': false,
  ide: 'vscode',
  'aasm-enabled': 'true',
  'aasm-mode': 'passive',
  'enable-linting': 'true',
  'confidence-threshold': '0.7',
  model: '',
  help: false,
  version: false,
};

function parseCliArgs(): { values: CliValues; positionals: string[] } {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'no-tui': { type: 'boolean', default: false },
        ide: { type: 'string', default: 'vscode' },
        'aasm-enabled': { type: 'string', default: 'true' },
        'aasm-mode': { type: 'string', default: 'passive' },
        'enable-linting': { type: 'string', default: 'true' },
        'confidence-threshold': { type: 'string', default: '0.7' },
        model: { type: 'string', default: '' },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
      allowPositionals: true,
    });

    return { values: values as CliValues, positionals };
  } catch {
    return { values: { ...DEFAULT_CLI_VALUES, help: true }, positionals: [] };
  }
}

// ============================================================================
// Help
// ============================================================================

function showHelp(): void {
  console.log(`
${colors.bold}Usage:${colors.reset} npx @ttalkkak-lab/opencode-contexty init [options]

${colors.bold}Options:${colors.reset}
  --no-tui                      Run in non-interactive mode
  --ide=<ide>                   IDE for extension: vscode (default) | vscode-insiders | vscodium | cursor | windsurf | none
  --aasm-enabled=<bool>         Enable AASM: true (default) | false
  --aasm-mode=<mode>            Set AASM mode: passive (default) | active
  --enable-linting=<bool>       Enable architecture linting: true (default) | false
  --confidence-threshold=<num>  Set confidence threshold: 0.0-1.0 (default: 0.7)
  --model=<model>               Set custom model for AASM (optional)
  -h, --help                    Show this help message
  -v, --version                 Show version

${colors.bold}Examples:${colors.reset}
  ${colors.dim}# Interactive mode${colors.reset}
  npx @ttalkkak-lab/opencode-contexty init

  ${colors.dim}# Non-interactive with defaults (installs VSCode extension)${colors.reset}
  npx @ttalkkak-lab/opencode-contexty init --no-tui

  ${colors.dim}# Install for Cursor IDE${colors.reset}
  npx @ttalkkak-lab/opencode-contexty init --no-tui --ide=cursor

  ${colors.dim}# Skip IDE extension installation${colors.reset}
  npx @ttalkkak-lab/opencode-contexty init --no-tui --ide=none

  ${colors.dim}# Active mode with custom model${colors.reset}
  npx @ttalkkak-lab/opencode-contexty init --no-tui --aasm-mode=active --model=google/antigravity-gemini-3-flash
`);
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function runInteractive(): Promise<{ config: ContextyConfig; ide: IDEType }> {
  banner();
  log(`${colors.dim}Let's configure your contexty.config.json${colors.reset}\n`);

  // 0. IDE Selection
  const ideChoice = await promptSelect(
    'Which IDE do you want to install the HSCMM extension for?',
    [
      'vscode - Visual Studio Code',
      'vscode-insiders - VS Code Insiders',
      'vscodium - VSCodium',
      'cursor - Cursor',
      'windsurf - Windsurf',
      'none - Skip IDE extension installation',
    ],
    0
  );
  const ide = ideChoice.split(' - ')[0] as IDEType;

  // 1. Enable AASM
  const enabled = await promptYesNo('Enable AASM (Active Agent-supervised Architecture)?', true);

  // 2. AASM Mode
  const modeChoice = await promptSelect(
    'Select AASM supervision mode:',
    [
      'passive - Monitors without intervention (recommended)',
      'active - Actively lints and analyzes intent',
    ],
    0
  );
  const aasmMode: 'passive' | 'active' = modeChoice.startsWith('passive') ? 'passive' : 'active';

  // 3. Enable Linting
  const enableLinting = await promptYesNo('Enable architecture linting?', true);

  // 4. Confidence Threshold
  const thresholdChoice = await promptSelect(
    'Set confidence threshold for AASM decisions:',
    ['0.5 - Lenient', '0.7 - Balanced (recommended)', '0.9 - Strict', 'Custom value'],
    1
  );

  let confidenceThreshold = 0.7;
  if (thresholdChoice.startsWith('0.5')) confidenceThreshold = 0.5;
  else if (thresholdChoice.startsWith('0.7')) confidenceThreshold = 0.7;
  else if (thresholdChoice.startsWith('0.9')) confidenceThreshold = 0.9;
  else if (thresholdChoice.startsWith('Custom')) {
    confidenceThreshold = await promptNumber('Enter confidence threshold (0.0-1.0)', 0.7);
    confidenceThreshold = Math.max(0, Math.min(1, confidenceThreshold));
  }

  // 5. Model (optional)
  const useCustomModel = await promptYesNo(
    'Use a custom model for AASM? (default: session model)',
    false
  );
  let model: string | undefined;

  if (useCustomModel) {
    const modelInput = await prompt(
      'Enter model identifier (e.g., google/antigravity-gemini-3-flash): '
    );
    if (modelInput) {
      model = modelInput;
    }
  }

  const config: ContextyConfig = {
    $schema: DEFAULT_CONFIG.$schema,
    aasm: { enabled, mode: aasmMode, enableLinting, confidenceThreshold },
  };

  if (model) {
    config.aasm.model = model;
  }

  return { config, ide };
}

// ============================================================================
// Non-Interactive Mode
// ============================================================================

function runNonInteractive(values: CliValues): ContextyConfig {
  const enabled = values['aasm-enabled'] !== 'false';
  const aasmMode = values['aasm-mode'] === 'active' ? 'active' : 'passive';
  const enableLinting = values['enable-linting'] !== 'false';
  const confidenceThreshold = Math.max(
    0,
    Math.min(1, parseFloat(values['confidence-threshold']) || 0.7)
  );
  const model = values.model || undefined;

  const config: ContextyConfig = {
    $schema: DEFAULT_CONFIG.$schema,
    aasm: { enabled, mode: aasmMode, enableLinting, confidenceThreshold },
  };

  if (model) {
    config.aasm.model = model;
  }

  return config;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const { values, positionals } = parseCliArgs();

  // Handle --version
  if (values.version) {
    try {
      const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));
      console.log(pkg.version);
    } catch {
      console.log('0.1.0');
    }
    process.exit(0);
  }

  // Handle --help
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  // Require 'init' command
  const command = positionals[0];
  if (command !== 'init') {
    if (command) {
      error(`Unknown command: ${command}`);
    }
    showHelp();
    process.exit(command ? 1 : 0);
  }

  // Check if config already exists
  const targetDir = process.cwd();
  const existingConfig = join(targetDir, 'contexty.config.json');

  if (existsSync(existingConfig)) {
    log(
      `${colors.yellow}⚠${colors.reset} contexty.config.json already exists at ${existingConfig}`
    );
    if (!values['no-tui']) {
      const overwrite = await promptYesNo('Do you want to overwrite it?', false);
      if (!overwrite) {
        info('Aborted. Existing config preserved.');
        process.exit(0);
      }
    } else {
      info('Overwriting existing config (--no-tui mode)');
    }
  }

  // Run interactive or non-interactive mode
  let config: ContextyConfig;
  let ide: IDEType;

  if (values['no-tui']) {
    info('Running in non-interactive mode...');
    config = runNonInteractive(values);
    ide = values.ide as IDEType;

    // Validate IDE option
    if (!isValidIDE(ide)) {
      log(
        `${colors.yellow}⚠${colors.reset} Invalid IDE option: ${ide}. Using 'vscode' as default.`
      );
      ide = 'vscode';
    }
  } else {
    const result = await runInteractive();
    config = result.config;
    ide = result.ide;
  }

  // Write config
  const configPath = writeConfig(config, targetDir);
  success(`Created ${configPath}`);

  // Register plugin
  log('');
  registerPlugin();

  // Install IDE extension
  installIDEExtension(ide);

  // Print summary
  const ideInfo = getIDEDisplayName(ide);
  log(`
${colors.green}${colors.bold}✓ Setup complete!${colors.reset}

${colors.bold}Configuration:${colors.reset}
  AASM Enabled:  ${config.aasm.enabled}
  AASM Mode:     ${config.aasm.mode}
  Linting:       ${config.aasm.enableLinting}
  Confidence:    ${config.aasm.confidenceThreshold}
  Model:         ${config.aasm.model || '(session default)'}
  IDE Extension: ${ideInfo}

${colors.dim}Run 'opencode' to start using the plugin.${colors.reset}
`);
}

main().catch((e) => {
  error(`Fatal error: ${e.message}`);
  process.exit(1);
});
