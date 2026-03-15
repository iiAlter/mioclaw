// Stub for removed Signal channel
export type SignalSender = {
  kind: "phone" | "uuid";
  raw: string;
  e164?: string;
  uuid?: string | null;
  number?: string | null;
};

export function looksLikeUuid(_value: string): boolean {
  return false;
}
export function resolveSignalPeerId(_source: string): string | null {
  return null;
}
export function resolveSignalRecipient(_source: string): string {
  return "";
}
export function resolveSignalSender(_params: {
  sourceUuid?: string | null;
  sourceNumber?: string | null;
}): string {
  return "";
}
export function isSignalSenderAllowed(_sender: SignalSender, _allowlist: string[]): boolean {
  return false;
}
