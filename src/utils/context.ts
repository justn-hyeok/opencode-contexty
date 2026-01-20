import fs from "fs/promises";
import path from "path";

export type ContextFilePart = {
  type: "file";
  mime: string;
  filename?: string;
  url: string;
  source?: {
    type?: string;
    path?: string;
    text?: {
      value?: string;
      start?: number;
      end?: number;
    };
  };
};

export type ContextTextPart = {
  type: "text";
  text: string;
};

export type ContextPart = ContextFilePart | ContextTextPart;

export type ContextSpec = {
  parts: ContextPart[];
};

const contextPath = (baseDir: string): string => {
  return path.join(baseDir, ".contexty", "context.json");
};

const ensureDir = async (baseDir: string): Promise<void> => {
  await fs.mkdir(path.join(baseDir, ".contexty"), { recursive: true });
};

export const readContextSpec = async (baseDir: string): Promise<ContextSpec> => {
  const filePath = contextPath(baseDir);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      parts: Array.isArray(parsed.parts) ? parsed.parts : []
    } as ContextSpec;
  } catch {
    return { parts: [] };
  }
};

export const writeContextSpec = async (baseDir: string, spec: ContextSpec): Promise<void> => {
  await ensureDir(baseDir);
  const filePath = contextPath(baseDir);
  await fs.writeFile(filePath, JSON.stringify(spec, null, 2), "utf8");
};

export const appendTextPart = async (baseDir: string, text: string): Promise<void> => {
  const spec = await readContextSpec(baseDir);
  spec.parts.push({ type: "text", text });
  await writeContextSpec(baseDir, spec);
};
