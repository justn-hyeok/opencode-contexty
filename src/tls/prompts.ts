import { BunShellOutput, TlsResult } from "./types"

export function getSummarizationPrompt(command: string, output: BunShellOutput) {
  return (
`Role: You are a technical support assistant specializing in CLI (Command Line Interface) analysis.
Task: Summarize the provided terminal command and its output(stdout, exitCode).

Requirements:
Fill this format.
"""
Status: (Success or Error)
(if it was failed) {
- (Reason of failure)
- (How can it be solved)
}
"""

command: ${command}
stdout: ${output.text()}
exitcode: ${output.exitCode}`
	);
}

export function getOutputPrompt(result: TlsResult) {
	return (
`Repeat content located after <tls-output-start> and before <tls-output-end>. Do not modify or add any characters.
<tls-output-start>

----------------------------------------------------
${result.command}
----------------------------------------------------
${result.output}
----------------------------------------------------
summary:
${result.summary}

<tls-output-end>`
	);
}