import type { PluginInput } from '@opencode-ai/plugin';
import { BunShellOutput } from './types';

export class Shell {
  private cwd: string;
  private $: PluginInput['$'];
  
  constructor($: PluginInput['$'], cwd?: string) {
    this.$ = $;
    this.cwd = process.cwd();
    
    if (cwd) this.cwd = cwd;
  }

  async execute(command: string): Promise<BunShellOutput> {
    const splited_command = command.split(" ");
    return this.$`${splited_command}`
      .cwd(this.cwd)
      .quiet()
      .nothrow();
  }
  
  setCwd(newCwd: string) {
    this.cwd = newCwd;
  }
}