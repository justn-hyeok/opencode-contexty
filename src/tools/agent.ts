import { tool } from '@opencode-ai/plugin';
import type { AASMModule } from '../aasm';

export function createAgentTool(aasm: AASMModule): ReturnType<typeof tool> {
  return tool({
    description:
      'AASM - Architecture supervision controls. Modes: active, passive, status, review.',
    args: {
      mode: tool.schema.enum(['active', 'passive', 'status', 'review']),
      limit: tool.schema.number().int().min(5).max(100).optional(),
    },
    async execute(args, context) {
      try {
        if (args.mode === 'review') {
          const report = await aasm.generateAntiPatternReport(context.sessionID, args.limit ?? 20);
          return JSON.stringify({ success: true, report });
        }

        const result = await aasm.handleCommand(args.mode);
        return JSON.stringify({ success: true, message: result });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });
}
