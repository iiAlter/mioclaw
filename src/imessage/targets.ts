// Stub for removed iMessage channel
export interface iMessageTarget {
  kind: "handle" | "chatGuid" | "chatIdentifier" | "chat_id" | "chat_guid";
  to: string;
  id: string;
  chatId?: string;
  chat_guid?: string;
  chat_identifier?: string;
  chatGuid?: string;
  chatIdentifier?: string;
}

export function parseIMessageTarget(_target: string): iMessageTarget {
  return { kind: "chat_id", to: "", id: "" };
}

export function normalizeIMessageHandle(_handle: string): string {
  return "";
}
