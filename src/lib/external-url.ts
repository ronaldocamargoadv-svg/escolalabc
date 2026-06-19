export const SAFE_EXTERNAL_URL_MESSAGE =
  "Informe um link seguro iniciado por http:// ou https://.";

export function isSafeExternalUrl(value?: string | null) {
  if (!value?.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
