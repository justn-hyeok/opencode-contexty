import fs from "fs/promises";
import path from "path";
import type { SessionState } from "./state";

export type UiState = {
  includedFiles: string[];
  pinnedFiles: string[];
  ignoredFiles: string[];
  otherParts: Array<{ type: string; label: string }>;
  updatedAt: string;
};

export type UiSelection = {
  pinnedFiles: string[];
  ignoredFiles: string[];
};

const ensureDir = async (baseDir: string): Promise<string> => {
  const dir = path.join(baseDir, ".contexty");
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

export const getUiStatePath = (baseDir: string): string => {
  return path.join(baseDir, ".contexty", "ui-state.json");
};

export const getUiSelectionPath = (baseDir: string): string => {
  return path.join(baseDir, ".contexty", "ui-selection.json");
};

export const writeUiState = async (baseDir: string, state: UiState): Promise<void> => {
  await ensureDir(baseDir);
  const filePath = getUiStatePath(baseDir);
  await Bun.write(filePath, JSON.stringify(state, null, 2));
};

export const readUiSelection = async (baseDir: string): Promise<UiSelection | null> => {
  const filePath = getUiSelectionPath(baseDir);
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return null;
  }
  try {
    const data = await file.json();
    return {
      pinnedFiles: Array.isArray(data.pinnedFiles) ? data.pinnedFiles : [],
      ignoredFiles: Array.isArray(data.ignoredFiles) ? data.ignoredFiles : []
    };
  } catch {
    return null;
  }
};

export const writeUiSelection = async (baseDir: string, session: SessionState): Promise<void> => {
  await ensureDir(baseDir);
  const filePath = getUiSelectionPath(baseDir);
  const payload: UiSelection = {
    pinnedFiles: session.pinnedFiles,
    ignoredFiles: session.ignoredFiles
  };
  await Bun.write(filePath, JSON.stringify(payload, null, 2));
};
