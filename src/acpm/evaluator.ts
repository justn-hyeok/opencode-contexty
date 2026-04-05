import path from 'path';
import type { FolderAccess, PermissionCheckResult, Preset } from './types';

const normalizePath = (value: string): string => {
  return path.resolve(value);
};

const isPathMatch = (candidate: string, rulePath: string): boolean => {
  return candidate === rulePath || candidate.startsWith(`${rulePath}${path.sep}`);
};

const accessToResult = (access: FolderAccess, operation: 'read' | 'write', matchedRule: string): PermissionCheckResult => {
  if (access === 'denied') {
    return {
      allowed: false,
      reason: `Denied by folder rule ${matchedRule}`,
      matchedRule,
    };
  }

  if (access === 'read-only') {
    return operation === 'read'
      ? { allowed: true, matchedRule }
      : {
          allowed: false,
          reason: `Write blocked by read-only folder rule ${matchedRule}`,
          matchedRule,
        };
  }

  return { allowed: true, matchedRule };
};

export class PermissionEvaluator {
  constructor(private readonly preset: Preset | null) {}

  resolveEffectivePermission(targetPath: string): FolderAccess | null {
    if (!this.preset) {
      return null;
    }

    const normalizedTargetPath = normalizePath(targetPath);
    let bestMatch: { path: string; access: FolderAccess } | null = null;

    for (const rule of this.preset.folderPermissions) {
      const normalizedRulePath = normalizePath(rule.path);

      if (!isPathMatch(normalizedTargetPath, normalizedRulePath)) {
        continue;
      }

      if (!bestMatch || normalizedRulePath.length > bestMatch.path.length) {
        bestMatch = { path: normalizedRulePath, access: rule.access };
      }
    }

    return bestMatch?.access ?? null;
  }

  checkFolderAccess(targetPath: string, operation: 'read' | 'write'): PermissionCheckResult {
    if (!this.preset) {
      return { allowed: true };
    }

    const normalizedTargetPath = normalizePath(targetPath);
    let bestMatch: { path: string; access: FolderAccess } | null = null;

    for (const rule of this.preset.folderPermissions) {
      const normalizedRulePath = normalizePath(rule.path);

      if (!isPathMatch(normalizedTargetPath, normalizedRulePath)) {
        continue;
      }

      if (!bestMatch || normalizedRulePath.length > bestMatch.path.length) {
        bestMatch = { path: normalizedRulePath, access: rule.access };
      }
    }

    if (!bestMatch) {
      return { allowed: true };
    }

    return accessToResult(bestMatch.access, operation, bestMatch.path);
  }

  checkToolAccess(_toolName: string): PermissionCheckResult {
    return { allowed: true };
  }
}
