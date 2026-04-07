import { describe, expect, it } from 'bun:test';
import path from 'path';
import { PermissionEvaluator } from './evaluator';
import type { Preset } from './types';

const makePreset = (folderPermissions: Preset['folderPermissions']): Preset => ({
  name: 'test',
  folderPermissions,
  toolPermissions: [],
  defaultPolicy: 'allow-all',
});

describe('PermissionEvaluator', () => {
  it('allows everything when preset is null', () => {
    const evaluator = new PermissionEvaluator(null);

    expect(evaluator.checkFolderAccess('/any/path', 'read')).toEqual({ allowed: true });
    expect(evaluator.checkFolderAccess('/any/path', 'write')).toEqual({ allowed: true });
    expect(evaluator.checkToolAccess('shell')).toEqual({ allowed: true });
    expect(evaluator.resolveEffectivePermission('/any/path')).toBeNull();
  });

  it('applies parent read-only access to descendants', () => {
    const evaluator = new PermissionEvaluator(makePreset([{ path: '/workspace/src', access: 'read-only' }]));

    expect(evaluator.checkFolderAccess('/workspace/src/deep/file.ts', 'read').allowed).toBe(true);
    expect(evaluator.checkFolderAccess('/workspace/src/deep/file.ts', 'write').allowed).toBe(false);
  });

  it('lets a deeper read-write rule override a parent rule', () => {
    const evaluator = new PermissionEvaluator(
      makePreset([
        { path: '/workspace/src', access: 'read-only' },
        { path: '/workspace/src/lib', access: 'read-write' },
      ])
    );

    expect(evaluator.checkFolderAccess('/workspace/src/lib/foo.ts', 'read')).toEqual({ allowed: true, matchedRule: path.resolve('/workspace/src/lib') });
    expect(evaluator.checkFolderAccess('/workspace/src/lib/foo.ts', 'write')).toEqual({ allowed: true, matchedRule: path.resolve('/workspace/src/lib') });
  });

  it('denies both read and write for denied folders', () => {
    const evaluator = new PermissionEvaluator(makePreset([{ path: '/workspace/private', access: 'denied' }]));

    expect(evaluator.checkFolderAccess('/workspace/private/file.txt', 'read').allowed).toBe(false);
    expect(evaluator.checkFolderAccess('/workspace/private/file.txt', 'write').allowed).toBe(false);
  });

  it('uses the deepest match across multiple nested rules', () => {
    const evaluator = new PermissionEvaluator(
      makePreset([
        { path: '/workspace/src', access: 'read-only' },
        { path: '/workspace/src/lib', access: 'read-write' },
        { path: '/workspace/src/lib/internal', access: 'denied' },
      ])
    );

    expect(evaluator.resolveEffectivePermission('/workspace/src/file.ts')).toBe('read-only');
    expect(evaluator.resolveEffectivePermission('/workspace/src/lib/file.ts')).toBe('read-write');
    expect(evaluator.resolveEffectivePermission('/workspace/src/lib/internal/secret.ts')).toBe('denied');
    expect(evaluator.checkFolderAccess('/workspace/src/lib/internal/secret.ts', 'read').allowed).toBe(false);
  });

  it('returns allow-all when no rule matches', () => {
    const evaluator = new PermissionEvaluator(makePreset([{ path: '/workspace/src', access: 'read-only' }]));

    expect(evaluator.checkFolderAccess('/workspace/docs/file.md', 'read')).toEqual({ allowed: true });
    expect(evaluator.resolveEffectivePermission('/workspace/docs/file.md')).toBeNull();
  });

  it('allows reads but blocks writes for read-only rules', () => {
    const evaluator = new PermissionEvaluator(makePreset([{ path: '/workspace', access: 'read-only' }]));

    expect(evaluator.checkFolderAccess('/workspace/file.txt', 'read').allowed).toBe(true);
    expect(evaluator.checkFolderAccess('/workspace/file.txt', 'write').allowed).toBe(false);
  });

  it('allows reads and writes for read-write rules', () => {
    const evaluator = new PermissionEvaluator(makePreset([{ path: '/workspace', access: 'read-write' }]));

    expect(evaluator.checkFolderAccess('/workspace/file.txt', 'read').allowed).toBe(true);
    expect(evaluator.checkFolderAccess('/workspace/file.txt', 'write').allowed).toBe(true);
  });

  it('keeps tool access allow-all regardless of tool name', () => {
    const evaluator = new PermissionEvaluator(
      makePreset([
        { path: '/workspace', access: 'denied' },
      ])
    );

    expect(evaluator.checkToolAccess('shell')).toEqual({ allowed: true });
    expect(evaluator.checkToolAccess('mcp:read-file')).toEqual({ allowed: true });
  });

  it('treats an empty folder permission list as allow-all', () => {
    const evaluator = new PermissionEvaluator(makePreset([]));

    expect(evaluator.checkFolderAccess('/workspace/anything', 'read')).toEqual({ allowed: true });
    expect(evaluator.checkFolderAccess('/workspace/anything', 'write')).toEqual({ allowed: true });
  });

  it('normalizes trailing slashes and dot-dot segments before matching', () => {
    const evaluator = new PermissionEvaluator(makePreset([{ path: '/workspace/src/', access: 'read-only' }]));

    expect(evaluator.resolveEffectivePermission('/workspace/src/../src//nested/file.ts')).toBe('read-only');
  });

  it('does not let sibling folders inherit a child override', () => {
    const evaluator = new PermissionEvaluator(
      makePreset([
        { path: '/workspace/src', access: 'read-only' },
        { path: '/workspace/src/lib', access: 'read-write' },
      ])
    );

    expect(evaluator.checkFolderAccess('/workspace/src/other/file.ts', 'write').allowed).toBe(false);
  });
});
