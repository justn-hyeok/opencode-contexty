import { PluginInput, Hooks } from '@opencode-ai/plugin';
import { TLSModule, getOutputPrompt } from '../tls';
import { appendToolLogEntry, ToolPart } from '../hscmm';
import { generateCustomId } from '../utils';

export function createTLSCommandHook(tls: TLSModule, pluginInput: PluginInput): Hooks['command.execute.before'] {
  return async (input, output) => {
    if (input.command === 'tls') {
      const tlsResult = await tls.executeTLS(input.arguments, input.sessionID);
      const template = (tlsResult.success) ? getOutputPrompt(tlsResult) : "Just Stop. Do not anything.";

      const timestamp = Date.now();
      const toolPart: ToolPart = {
        id: generateCustomId('tls'),
        sessionID: input.sessionID,
        messageID: generateCustomId('msg'),
        type: "tool",
        callID: generateCustomId("call"),
        tool: "bash",
        state: {
          title: "TLS summary context",
          status: "completed",
          input:  {
            command: input.arguments
          },
          output: `output: ${tlsResult.output}\nsummary: ${tlsResult.summary}`,
          metadata: {
            output: `output: ${tlsResult.output}\nsummary: ${tlsResult.summary}`,
            truncated: false
          },
          time: {
            start: timestamp,
            end: timestamp
          }
        }
      }

      appendToolLogEntry(pluginInput.directory, toolPart);

      output.parts.length = 0;
      output.parts.push({
        type: 'text',
        text: template,
        synthetic: true,
        sessionID: input.sessionID,
        messageID: 'tls-message',
        id: 'tls-part',
      });
    }
  }
}