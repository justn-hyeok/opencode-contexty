import path from "path";

export type SessionState = {
  pinnedFiles: string[];
  ignoredFiles: string[];
  tokensUsed: number;
  tokenLimit: number;
};

const DEFAULT_TOKEN_LIMIT = 200000;

export const ensureSessionState = (state: Map<string, SessionState>, sessionID: string): SessionState => {
  const existing = state.get(sessionID);
  if (existing) {
    return existing;
  }

  const next: SessionState = {
    pinnedFiles: [],
    ignoredFiles: [],
    tokensUsed: 0,
    tokenLimit: DEFAULT_TOKEN_LIMIT
  };
  state.set(sessionID, next);
  return next;
};

export const normalizePath = (input: string, baseDir: string): string => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Path is required.");
  }
  const resolved = path.resolve(baseDir, trimmed);
  const relative = path.relative(baseDir, resolved);
  const normalized = relative.split(path.sep).join("/");
  if (normalized.startsWith("..")) {
    throw new Error("Path must be inside the project.");
  }
  return normalized.replace(/^\.\//, "");
};

export const normalizeContextPath = (input: string | undefined, baseDir: string): string | null => {
  if (!input) {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(baseDir, trimmed);
  const relative = path.relative(baseDir, resolved);
  const normalized = relative.split(path.sep).join("/");
  if (normalized.startsWith("..")) {
    return null;
  }
  return normalized.replace(/^\.\//, "");
};

export const isPathMatch = (target: string, entries: string[]): boolean => {
  return entries.some((entry) => target === entry || target.startsWith(`${entry}/`));
};

const snapshotDir = process.env.CONTEXTY_SNAPSHOT_DIR || ".contexty/snapshots";

export const writeSnapshot = async (tag: string, session: SessionState): Promise<void> => {
  const sanitized = tag.trim();
  if (!sanitized) {
    throw new Error("Snapshot tag is required.");
  }
  const path = `${snapshotDir}/${sanitized}.json`;
  const payload = JSON.stringify(session, null, 2);
  await Bun.write(path, payload);
};

export const readSnapshot = async (tag: string): Promise<SessionState> => {
  const sanitized = tag.trim();
  if (!sanitized) {
    throw new Error("Snapshot tag is required.");
  }
  const path = `${snapshotDir}/${sanitized}.json`;
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`Snapshot not found: ${sanitized}`);
  }
  const data = await file.json();
  return {
    pinnedFiles: Array.isArray(data.pinnedFiles) ? data.pinnedFiles : [],
    ignoredFiles: Array.isArray(data.ignoredFiles) ? data.ignoredFiles : [],
    tokensUsed: typeof data.tokensUsed === "number" ? data.tokensUsed : 0,
    tokenLimit: typeof data.tokenLimit === "number" ? data.tokenLimit : DEFAULT_TOKEN_LIMIT
  };
};
