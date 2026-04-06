import type { SessionState, WithParts } from "../types";

export function isMessageCompacted(_state: SessionState, _msg: WithParts): boolean {
  return false;
}
