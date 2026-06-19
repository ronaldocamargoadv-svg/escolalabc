import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import {
  cancelCertificate,
  CertificateIssueError,
  issueCertificate,
  listCertificates
} from "@/lib/certificates";

const issueCertificateSchema = z.object({
  inscricaoId: z.string().uuid()
}).strict();

const cancelCertificateSchema = z.object({
  certificadoId: z.string().uuid(),
  motivo: z.string().min(5)
}).strict();

export async function GET() {
  const auth = await requireApiPermission("certificates.view");
  if (auth.response) return auth.response;

  return NextResponse.json({ data: await listCertificates(auth.user) });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("certificates.issue");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = issueCertificateSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  let issued;
  try {
    issued = await issueCertificate(parsed.data.inscricaoId);
  } catch (error) {
    if (error instanceof CertificateIssueError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
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
    } via API.`
  });

  return NextResponse.json({ data: certificate }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireApiPermission("certificates.cancel");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = cancelCertificateSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const certificate = await cancelCertificate(
    parsed.data.certificadoId,
    parsed.data.motivo
  );

  if (!certificate) {
    return NextResponse.json(
      { error: "CERTIFICATE_NOT_FOUND", message: "Certificado não encontrado." },
      { status: 404 }
    );
  }

  await writeAuditLog({
    action: "certificado.cancelado",
    entity: "certificados",
    entityId: certificate.id,
    summary: `Certificado ${certificate.codigo_validacao} cancelado via API: ${parsed.data.motivo}.`
  });

  return NextResponse.json({ data: certificate });
}
