import type { ToolCategory } from './types';

const toolToCategoryEntries = [
  ['read', 'file-read'],
  ['glob', 'file-read'],
  ['grep', 'file-read'],
  ['list', 'file-read'],
  ['edit', 'file-write'],
  ['write', 'file-write'],
  ['apply_patch', 'file-write'],
  ['bash', 'shell'],
  ['task', 'shell'],
  ['webfetch', 'web'],
  ['websearch', 'web'],
  ['lsp_goto_definition', 'lsp'],
  ['lsp_find_references', 'lsp'],
  ['lsp_symbols', 'lsp'],
  ['lsp_diagnostics', 'lsp'],
  ['lsp_prepare_rename', 'lsp'],
  ['lsp_rename', 'lsp'],
  ['external_directory', 'mcp'],
  ['skill_mcp', 'mcp'],
] as const;

const categoryToToolsEntries: Record<ToolCategory, readonly string[]> = {
  'file-read': ['read', 'glob', 'grep', 'list'],
  'file-write': ['edit', 'write', 'apply_patch'],
  shell: ['bash', 'task'],
  web: ['webfetch', 'websearch'],
  lsp: [
    'lsp_goto_definition',
    'lsp_find_references',
    'lsp_symbols',
    'lsp_diagnostics',
    'lsp_prepare_rename',
    'lsp_rename',
  ],
  mcp: ['external_directory', 'skill_mcp'],
};

const toolToCategoryMap = new Map<string, ToolCategory>(toolToCategoryEntries);

export function getToolCategory(toolName: string): ToolCategory | null {
  return toolToCategoryMap.get(toolName) ?? null;
}

export function getToolsForCategory(category: ToolCategory): string[] {
  return [...categoryToToolsEntries[category]];
}
