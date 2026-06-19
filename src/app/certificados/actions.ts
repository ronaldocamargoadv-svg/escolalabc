"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import {
  approveConclusionAndIssueCertificate,
  cancelCertificate,
  CertificateIssueError,
  issueCertificate
} from "@/lib/certificates";

const issueCertificateSchema = z.object({
  inscricaoId: z.string().uuid()
});

const cancelCertificateSchema = z.object({
  certificadoId: z.string().uuid(),
  motivo: z.string().min(5)
});

export async function issueCertificateAction(formData: FormData) {
  const user = await requirePermission("certificates.issue");

  const parsed = issueCertificateSchema.safeParse({
    inscricaoId: formData.get("inscricaoId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para emissão de certificado.");
  }

  let issued;
  try {
    issued = await issueCertificate(parsed.data.inscricaoId, user.id);
  } catch (error) {
    if (error instanceof CertificateIssueError) {
      throw new Error(error.message);
    }

    throw error;
  }
  const { certificate, isReissue } = issued;

  await writeAuditLog({
    action: isReissue ? "certificado.reemitido" : "certificado.emitido",
    entity: "certificados",
    entityId: certificate.id,
    summary: `Certificado ${certificate.codigo_validacao} ${
      isReissue ? "reemitido" : "emitido"
    }.`
  });

  revalidatePath("/certificados");
  revalidatePath("/certificados/validar");
}

export async function approveConclusionAction(formData: FormData) {
  const user = await requirePermission("certificates.issue");

  const parsed = issueCertificateSchema.safeParse({
    inscricaoId: formData.get("inscricaoId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para aprovação da conclusão.");
  }

  let issued;
  try {
    issued = await approveConclusionAndIssueCertificate(
      parsed.data.inscricaoId,
      user.id
    );
  } catch (error) {
    if (error instanceof CertificateIssueError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: "certificado.conclusao_aprovada",
    entity: "inscricoes",
    entityId: parsed.data.inscricaoId,
    summary: `Conclusão aprovada e certificado ${issued.certificate.codigo_validacao} emitido automaticamente.`
  });

  revalidatePath("/");
  revalidatePath("/certificados");
  revalidatePath("/engajamento");
  revalidatePath("/minha-area");
  revalidatePath("/certificados/validar");
}

export async function cancelCertificateAction(formData: FormData) {
  await requirePermission("certificates.cancel");

  const parsed = cancelCertificateSchema.safeParse({
    certificadoId: formData.get("certificadoId"),
    motivo: formData.get("motivo")
  });

  if (!parsed.success) {
    throw new Error("Informe um motivo de cancelamento válido.");
  }

  const certificate = await cancelCertificate(
    parsed.data.certificadoId,
    parsed.data.motivo
  );

  if (!certificate) {
    throw new Error("Certificado não encontrado.");
  }

  await writeAuditLog({
    action: "certificado.cancelado",
    entity: "certificados",
    entityId: certificate.id,
    summary: `Certificado ${certificate.codigo_validacao} cancelado: ${parsed.data.motivo}.`
  });

  revalidatePath("/certificados");
  revalidatePath("/certificados/validar");
}
