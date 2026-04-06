import type {
  AcpmMetrics,
  FileMetrics,
  MetricsSnapshot,
  ToolMetrics,
  TokenMetrics,
} from './types';

interface MessagePart {
  type: string;
  [key: string]: any;
}

interface MessageInfo {
  id: string;
  role: string;
}

interface Message {
  info: MessageInfo;
  parts: MessagePart[];
}

function estimateTokens(content: unknown): number {
  return typeof content === 'string' && content.length > 0 ? Math.ceil(content.length / 4) : 0;
}

function isErrorStatus(status: unknown): boolean {
  return status === 'error' || status === 'failed' || status === 'failure' || status === 'errored';
}

export class MetricsCollector {
  constructor(private readonly directory: string) {}

  collect(messages: Message[], sessionId = 'unknown'): MetricsSnapshot {
    void this.directory;

    const tokens: TokenMetrics = {
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    };

    const files = new Map<string, FileMetrics>();
    const tools = new Map<string, ToolMetrics>();

    for (const message of messages) {
      let messageTokens = 0;

      for (const part of message.parts) {
        if (typeof part.content === 'string' && part.content.length > 0) {
          messageTokens += estimateTokens(part.content);
        }

        if (typeof part.text === 'string' && part.text.length > 0) {
          messageTokens += estimateTokens(part.text);
        }

        if (part.type === 'file') {
          const path = part.source?.path ?? part.url;
          if (typeof path !== 'string' || path.length === 0) {
            continue;
          }

          const tokenEstimate = estimateTokens(part.content);
          const existing = files.get(path);
          if (existing) {
            existing.tokenEstimate += tokenEstimate;
          } else {
            files.set(path, {
              path,
              tokenEstimate,
              role: message.info.role,
            });
          }
        }

        if (part.type === 'tool') {
          const name = part.tool;
          if (typeof name !== 'string' || name.length === 0) {
            continue;
          }

          const status = part.state?.status;
          if (status !== 'completed' && !isErrorStatus(status)) {
            continue;
          }

          const existing = tools.get(name);
          if (existing) {
            existing.count += 1;
            if (status === 'completed') {
              existing.successCount += 1;
            } else {
              existing.failCount += 1;
            }
          } else {
            tools.set(name, {
              name,
              count: 1,
              successCount: status === 'completed' ? 1 : 0,
              failCount: status === 'completed' ? 0 : 1,
            });
          }
        }
      }

      if (message.info.role === 'assistant') {
        tokens.output += messageTokens;
      } else {
        tokens.input += messageTokens;
      }
    }

    return {
      version: 1,
      sessionID: sessionId,
      timestamp: new Date().toISOString(),
      tokens,
      files: [...files.values()],
      tools: [...tools.values()],
      acpm: this.createEmptyAcpmMetrics(),
    };
  }

  private createEmptyAcpmMetrics(): AcpmMetrics {
    return {
      activePreset: null,
      allowCount: 0,
      denyCount: 0,
      sanitizeCount: 0,
      deniedByCategory: {},
      folderAccessDistribution: {
        denied: 0,
        'read-only': 0,
        'read-write': 0,
      },
      toolCategoryStatus: [],
    };
  }
}
