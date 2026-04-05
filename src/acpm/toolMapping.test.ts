import { describe, expect, test } from 'bun:test';
import { getToolCategory, getToolsForCategory } from './toolMapping';

describe('tool mapping', () => {
  test('maps read to file-read', () => {
    expect(getToolCategory('read')).toBe('file-read');
  });

  test('maps edit to file-write', () => {
    expect(getToolCategory('edit')).toBe('file-write');
  });

  test('maps bash to shell', () => {
    expect(getToolCategory('bash')).toBe('shell');
  });

  test('maps webfetch to web', () => {
    expect(getToolCategory('webfetch')).toBe('web');
  });

  test('maps lsp_goto_definition to lsp', () => {
    expect(getToolCategory('lsp_goto_definition')).toBe('lsp');
  });

  test('maps external_directory to mcp', () => {
    expect(getToolCategory('external_directory')).toBe('mcp');
  });

  test('returns null for unknown tool', () => {
    expect(getToolCategory('unknown_tool')).toBeNull();
  });

  test('returns tools for each category', () => {
    expect(getToolsForCategory('file-read')).toEqual(['read', 'glob', 'grep', 'list']);
    expect(getToolsForCategory('file-write')).toEqual(['edit']);
    expect(getToolsForCategory('shell')).toEqual(['bash', 'task']);
    expect(getToolsForCategory('web')).toEqual(['webfetch', 'websearch']);
    expect(getToolsForCategory('lsp')).toEqual([
      'lsp_goto_definition',
      'lsp_find_references',
      'lsp_symbols',
      'lsp_diagnostics',
      'lsp_prepare_rename',
      'lsp_rename',
    ]);
    expect(getToolsForCategory('mcp')).toEqual(['external_directory', 'skill_mcp']);
  });
});
