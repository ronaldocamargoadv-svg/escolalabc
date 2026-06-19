import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { enrollCurrentUserInClass } from "@/lib/catalog";
import { EnrollmentError } from "@/lib/enrollments";

const selfEnrollmentSchema = z.object({
  turmaId: z.string().uuid()
});

export async function POST(request: Request) {
  const auth = await requireApiPermission("enrollments.create");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = selfEnrollmentSchema.safeParse(body.data);

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
    const enrollment = await enrollCurrentUserInClass(
      auth.user.id,
      parsed.data.turmaId
    );

    await writeAuditLog({
      action: "inscricao.autoinscricao",
      entity: "inscricoes",
      entityId: enrollment.id,
      summary: "Autoinscrição registrada pelo aluno via API."
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof EnrollmentError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: "SELF_ENROLLMENT_FAILED",
        message: "Não foi possível realizar a inscrição."
      },
      { status: 422 }
    );
  }
}
