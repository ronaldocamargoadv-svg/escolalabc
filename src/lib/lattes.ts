export const LATTES_EXAMPLE_URL =
  "https://lattes.cnpq.br/0000000000000000";

export const LATTES_INVALID_MESSAGE =
  `Informe um link válido da Plataforma Lattes, por exemplo: ${LATTES_EXAMPLE_URL}.`;

export class LattesValidationError extends Error {
  constructor(message = LATTES_INVALID_MESSAGE) {
    super(message);
    this.name = "LattesValidationError";
  }
}

export function normalizeLattesUrl(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new LattesValidationError();
  }

  const cleanPath = url.pathname.replace(/\/+$/, "");
  const valid =
    (url.protocol === "http:" || url.protocol === "https:") &&
    url.hostname.toLowerCase() === "lattes.cnpq.br" &&
    /^\/\d{16}$/.test(cleanPath) &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password;

  if (!valid) {
    throw new LattesValidationError();
  }

  return `https://lattes.cnpq.br${cleanPath}`;
}
