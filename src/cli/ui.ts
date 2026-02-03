/**
 * CLI UI utilities - colors, logging, and banner
 */

// ANSI colors
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

export function log(message: string): void {
  console.log(message);
}

export function success(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

export function info(message: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

export function warn(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

export function error(message: string): void {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

export function banner(): void {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ${colors.bold}OpenCode Contexty${colors.reset}${colors.cyan}                                ║
║   ${colors.dim}Vibe Engineering with HSCMM & AASM${colors.reset}${colors.cyan}                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝${colors.reset}
`);
}
