import { describe, expect, it, mock } from 'bun:test';
import { createAgentTool } from './agent';

describe('createAgentTool', () => {
  it('runs review mode with current session id', async () => {
    const aasm = {
      generateAntiPatternReport: mock(async (sessionID: string, limit: number) => {
        return `report for ${sessionID} (${limit})`;
      }),
      handleCommand: mock(async () => 'ok'),
    };

    const toolDef = createAgentTool(aasm as any);
    const result = await toolDef.execute(
      { mode: 'review', limit: 30 } as any,
      { sessionID: 'session-review-1' } as any
    );

    const parsed = JSON.parse(result);
    expect(aasm.generateAntiPatternReport).toHaveBeenCalledWith('session-review-1', 30);
    expect(parsed.success).toBe(true);
    expect(parsed.report).toContain('session-review-1');
  });

  it('delegates non-review mode to handleCommand', async () => {
    const aasm = {
      generateAntiPatternReport: mock(async () => 'report'),
      handleCommand: mock(async () => 'status-ok'),
    };

    const toolDef = createAgentTool(aasm as any);
    const result = await toolDef.execute(
      { mode: 'status' } as any,
      { sessionID: 'session-review-2' } as any
    );

    const parsed = JSON.parse(result);
    expect(aasm.handleCommand).toHaveBeenCalledWith('status');
    expect(aasm.generateAntiPatternReport).not.toHaveBeenCalled();
    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe('status-ok');
  });
});
