// Stub for removed iMessage channel
export function normalizeIMessageTarget(
  _target: string,
): { kind: string; value: string } | null | undefined {
  const trimmed = _target.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^(imessage:|sms:|auto:|chat_id:|chat_guid:|chat_identifier:)/i.test(trimmed)) {
    return { kind: "id", value: trimmed };
  }
  if (trimmed.includes("@")) {
    return { kind: "email", value: trimmed };
  }
  if (/^\+?\d{3,}$/.test(trimmed)) {
    return { kind: "phone", value: trimmed };
  }
  return undefined;
}

export function looksLikeIMessageTarget(_value: string): boolean {
  return looksLikeIMessageTargetId(_value);
}

export function looksLikeIMessageTargetId(_value: string): boolean {
  const trimmed = _value.trim();
  if (!trimmed) {
    return false;
  }
  if (/^(imessage:|sms:|auto:|chat_id:|chat_guid:|chat_identifier:)/i.test(trimmed)) {
    return true;
  }
  if (trimmed.includes("@")) {
    return true;
  }
  return /^\+?\d{3,}$/.test(trimmed);
}

export function normalizeIMessageMessagingTarget(
  _target: string,
): { kind: string; value: string } | null | undefined {
  return normalizeIMessageTarget(_target);
}
