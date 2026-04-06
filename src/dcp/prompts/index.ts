import type { DCPConfig } from '../types';
import { buildProtectedToolsExtension } from './extensions/system';
import { getCompressToolExtension } from './extensions/tool';

const DEFAULT_SYSTEM_PROMPT = `Use the compress tool only when it helps reduce context without losing important details.`;

export function renderSystemPrompt(config: DCPConfig): string {
  if (config.experimental.customPrompts) {
    return [
      DEFAULT_SYSTEM_PROMPT,
      getCompressToolExtension(config.compress.mode),
      buildProtectedToolsExtension(config),
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  return [
    DEFAULT_SYSTEM_PROMPT,
    getCompressToolExtension(config.compress.mode),
    buildProtectedToolsExtension(config),
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export { buildProtectedToolsExtension } from './extensions/system';
export { MESSAGE_FORMAT_EXTENSION, RANGE_FORMAT_EXTENSION, getCompressToolExtension } from './extensions/tool';
