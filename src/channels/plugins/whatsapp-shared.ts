// Stub for removed WhatsApp channel
export type WhatsAppAccount = {
  accountId: string;
  phoneNumberId?: string;
};

export function resolveWhatsAppAccount(_params: unknown): WhatsAppAccount {
  return { accountId: "" };
}

export function resolveWhatsAppGroupIntroHint(_params: unknown): string | null {
  return null;
}

export function resolveWhatsAppMentionStripPatterns(): RegExp[] {
  return [];
}
