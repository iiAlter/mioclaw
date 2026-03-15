// Stub for removed WhatsApp channel
export function normalizeWhatsAppTarget(
  _target: string,
): { kind: string; value: string } | null | undefined {
  const trimmed = _target.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^(whatsapp:|\+)/i.test(trimmed)) {
    return { kind: "phone", value: trimmed.replace(/^whatsapp:/i, "") };
  }
  if (/^\d{5,}@c\.us$/.test(trimmed)) {
    return { kind: "jid", value: trimmed };
  }
  if (/^\d{5,}$/.test(trimmed)) {
    return { kind: "phone", value: trimmed };
  }
  return undefined;
}

export function looksLikeWhatsAppTarget(_value: string): boolean {
  return looksLikeWhatsAppTargetId(_value);
}

export function looksLikeWhatsAppTargetId(_value: string): boolean {
  const trimmed = _value.trim();
  if (!trimmed) {
    return false;
  }
  if (/^(whatsapp:|\+)/i.test(trimmed)) {
    return true;
  }
  if (/^\d{5,}@c\.us$/.test(trimmed)) {
    return true;
  }
  if (/^\d{5,}$/.test(trimmed)) {
    return true;
  }
  return false;
}

export function normalizeWhatsAppMessagingTarget(
  _target: string,
): { kind: string; value: string } | null | undefined {
  return normalizeWhatsAppTarget(_target);
}
