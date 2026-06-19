import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import {
  createManagedEnrollment,
  EnrollmentError,
  listEnrollments,
  updateEnrollmentStatus
} from "@/lib/enrollments";

const createEnrollmentSchema = z.object({
  usuarioId: z.string().uuid(),
  turmaId: z.string().uuid()
});

const updateEnrollmentStatusSchema = z.object({
  inscricaoId: z.string().uuid(),
  status: z.enum(["inscrito", "cancelado"])
});

const querySchema = z.object({
  status: z.enum(["ativo", "cancelado", "todos"]).default("todos")
});

export async function GET(request: Request) {
  const auth = await requireApiPermission("enrollments.view");
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? "todos"
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Parâmetros inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    data: await listEnrollments({ status: parsed.data.status, user: auth.user })
  });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("enrollments.manage");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = createEnrollmentSchema.safeParse(body.data);

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

  let enrollment;
  try {
    enrollment = await createManagedEnrollment({
      ...parsed.data,
      origem: "gestao"
    });
  } catch (error) {
    if (error instanceof EnrollmentError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  await writeAuditLog({
    action: "inscricao.criada",
    entity: "inscricoes",
    entityId: enrollment.id,
    summary: "Inscrição registrada ou reativada via API."
  });

  return NextResponse.json({ data: enrollment }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireApiPermission("enrollments.manage");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = updateEnrollmentStatusSchema.safeParse(body.data);

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
    const enrollment = await updateEnrollmentStatus(
      parsed.data.inscricaoId,
      parsed.data.status
    );

    await writeAuditLog({
      action:
        parsed.data.status === "cancelado"
          ? "inscricao.cancelada_gestao"
          : "inscricao.reativada_gestao",
      entity: "inscricoes",
      entityId: enrollment.id,
      summary: `Inscrição na turma ${enrollment.turma} alterada para ${enrollment.status} via API.`
    });

    return NextResponse.json({ data: enrollment });
  } catch (error) {
    if (error instanceof EnrollmentError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }
}
