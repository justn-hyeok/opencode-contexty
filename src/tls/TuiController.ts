import type { PluginInput } from '@opencode-ai/plugin';

export class TuiController {
  private client: PluginInput['client'];
  private interval?: NodeJS.Timeout;

  constructor(client: PluginInput['client']) {
    this.client = client;
  }

  showFail(): undefined {
    this.client.tui.showToast({
      body: {
        title: 'TLS Info',
        message: `❌ Fail to summarize.`,
        variant: 'error',
        duration: 4000
      }
    });
  }

  showSuccess(): undefined {
    this.client.tui.showToast({
      body: {
        title: 'TLS Info',
        message: `✅ Succeed to summarize.`,
        variant: 'success',
        duration: 4000
      }
    });
  }
  
  showSummarizingTui(command: string): undefined {
    if (this?.interval) return;

    const progressIcons = ['   ', '.  ', '.. ', '...', '...', '.. ', '.  ', '   '];
    let index = 0;

    this.interval = setInterval(()=>{
      this.client.tui.showToast({
        body: {
          title: 'TLS Info',
          message: `✅ Command '${command.substring(0, 16)}${(command.length > 16) ? '...' : ''}' was executed.\nSummarizing${progressIcons[index]}`,
          variant: 'info',
          duration: 500
        }
      });
      index = (index + 1) % progressIcons.length;
    }, 175);
  }

  clear(): undefined {
    if (this?.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

}