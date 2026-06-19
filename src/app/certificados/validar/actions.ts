"use server";

import { getPublicCertificate, type PublicCertificate } from "@/lib/certificates";

export type ValidationState = {
  certificate?: PublicCertificate;
  error?: string;
};

export async function validateCertificateAction(
  _state: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();

  if (!codigo) {
    return { error: "Informe o código de validação." };
  }

  const certificate = await getPublicCertificate(codigo);

  if (!certificate) {
    return { error: "Certificado não encontrado." };
  }

  return { certificate };
}
