import type { ReplyPayload } from "../types.js";

export function parseLineDirectives(payload: ReplyPayload): ReplyPayload {
  return payload;
}

export function hasLineDirectives(_text: string): boolean {
  return false;
}
