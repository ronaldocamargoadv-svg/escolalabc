import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiUser } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { cancelMyEnrollment } from "@/lib/my-area";

const cancelEnrollmentSchema = z.object({
  inscricaoId: z.string().uuid()
});

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = cancelEnrollmentSchema.safeParse(body.data);

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

  try {
    const enrollment = await cancelMyEnrollment(
      auth.user.id,
      parsed.data.inscricaoId
    );

    await writeAuditLog({
      action: "inscricao.cancelada_participante",
      entity: "inscricoes",
      entityId: enrollment.id,
      summary: `Inscrição na turma ${enrollment.turma} cancelada pelo aluno via API.`
    });

    return NextResponse.json({ data: enrollment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível cancelar.";
    const status = message.toLocaleLowerCase("pt-BR").includes("não encontrada")
      ? 404
      : message.includes("certificado")
        ? 409
        : 422;

    return NextResponse.json(
      {
        error: "ENROLLMENT_CANCEL_FAILED",
        message
      },
      { status }
    );
  }
}
