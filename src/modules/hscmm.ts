import { tool } from "@opencode-ai/plugin";
import { ensureSessionState, normalizePath, readSnapshot, type SessionState, writeSnapshot } from "../utils/state";

type ToolOptions = {
  baseDir: string;
};

export const createHscmmTools = (state: Map<string, SessionState>, options: ToolOptions) => ({
  ctx_status: tool({
    description: "Show current context status.",
    args: {},
    execute: async (_args, { sessionID }) => {
      const session = ensureSessionState(state, sessionID);
      const pinnedCount = session.pinnedFiles.length;
      const ignoredCount = session.ignoredFiles.length;
      const tokensUsed = session.tokensUsed;
      const tokenLimit = session.tokenLimit;
      const usagePercent = tokenLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)) : 0;

      const pinnedList = pinnedCount > 0 ? session.pinnedFiles.join(", ") : "(none)";
      const ignoredList = ignoredCount > 0 ? session.ignoredFiles.join(", ") : "(none)";

      return [
        "[Context Status]",
        `Tokens: ${tokensUsed}/${tokenLimit} (${usagePercent}%)`,
        `Pinned: ${pinnedList}`,
        `Ignored: ${ignoredList}`
      ].join("\n");
    }
  }),
  ctx_add: tool({
    description: "Pin a file or directory to context.",
    args: {
      path: tool.schema.string().describe("Path to pin")
    },
    execute: async ({ path }, { sessionID }) => {
      const session = ensureSessionState(state, sessionID);
      const normalized = normalizePath(path, options.baseDir);

      if (!session.pinnedFiles.includes(normalized)) {
        session.pinnedFiles.push(normalized);
      }
      session.ignoredFiles = session.ignoredFiles.filter((item) => item !== normalized);
      state.set(sessionID, session);

      return `Pinned: ${normalized}`;
    }
  }),
  ctx_ignore: tool({
    description: "Ignore a file or directory from context.",
    args: {
      path: tool.schema.string().describe("Path to ignore")
    },
    execute: async ({ path }, { sessionID }) => {
      const session = ensureSessionState(state, sessionID);
      const normalized = normalizePath(path, options.baseDir);

      if (!session.ignoredFiles.includes(normalized)) {
        session.ignoredFiles.push(normalized);
      }
      session.pinnedFiles = session.pinnedFiles.filter((item) => item !== normalized);
      state.set(sessionID, session);

      return `Ignored: ${normalized}`;
    }
  }),
  ctx_clear: tool({
    description: "Clear pinned and ignored context entries.",
    args: {},
    execute: async (_args, { sessionID }) => {
      const session = ensureSessionState(state, sessionID);
      session.pinnedFiles = [];
      session.ignoredFiles = [];
      state.set(sessionID, session);

      return "Context entries cleared.";
    }
  }),
  ctx_save: tool({
    description: "Save current context snapshot.",
    args: {
      tag: tool.schema.string().describe("Snapshot tag name")
    },
    execute: async ({ tag }, { sessionID }) => {
      const session = ensureSessionState(state, sessionID);
      await writeSnapshot(tag, session);

      return `Snapshot saved: ${tag}`;
    }
  }),
  ctx_load: tool({
    description: "Load a context snapshot.",
    args: {
      tag: tool.schema.string().describe("Snapshot tag name")
    },
    execute: async ({ tag }, { sessionID }) => {
      const session = ensureSessionState(state, sessionID);
      const snapshot = await readSnapshot(tag);

      session.pinnedFiles = snapshot.pinnedFiles;
      session.ignoredFiles = snapshot.ignoredFiles;
      session.tokensUsed = snapshot.tokensUsed;
      session.tokenLimit = snapshot.tokenLimit;
      state.set(sessionID, session);

      return `Snapshot loaded: ${tag}`;
    }
  })
});
