import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiAnyPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";
import {
  ClassInstructorError,
  ClassStatusError,
  CourseUnavailableForClassError,
  createClass,
  listClasses,
  updateClassInstructor,
  updateClassStatus
} from "@/lib/classes";

const createClassSchema = z.object({
  cursoId: z.string().uuid(),
  nome: z.string().trim().min(3).max(120),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vagas: z.coerce.number().int().nonnegative(),
  modalidade: z.enum(["presencial", "online", "hibrido"]),
  local: z.string().trim().max(200).optional(),
  linkOnline: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE)
    .optional(),
  criterioFrequenciaMinima: z.coerce.number().min(0).max(100).default(75),
  instrutorId: z.string().uuid().optional()
});

const updateClassSchema = z
  .object({
    turmaId: z.string().uuid(),
    status: z.enum(["rascunho", "publicada", "cancelada", "encerrada"]).optional(),
    instrutorId: z.string().uuid().nullable().optional()
  })
  .refine((value) => value.status || value.instrutorId !== undefined, {
    message: "Informe status ou instrutorId."
  });

export async function GET() {
  const auth = await requireApiAnyPermission([
    "courses.publish",
    "enrollments.manage"
  ]);
  if (auth.response) return auth.response;

  const classes = await listClasses(auth.user);

  return NextResponse.json({ data: classes });
}

export async function POST(request: Request) {
  const auth = await requireApiAnyPermission([
    "courses.publish",
    "enrollments.manage"
  ]);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = createClassSchema.safeParse(body.data);

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

  let turma;
  try {
    turma = await createClass(parsed.data, auth.user.id);
  } catch (error) {
    if (error instanceof CourseUnavailableForClassError) {
      return NextResponse.json(
        { error: "COURSE_UNAVAILABLE", message: error.message },
        { status: 409 }
      );
    }

    if (error instanceof ClassInstructorError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof ClassStatusError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  if (!turma) {
    return NextResponse.json(
      { error: "COURSE_NOT_FOUND", message: "Curso não encontrado." },
      { status: 404 }
    );
  }

  await writeAuditLog({
    action: "turma.criada",
    entity: "turmas",
    entityId: turma.id,
    summary: `Turma ${turma.nome} criada via API.`
  });

  return NextResponse.json({ data: turma }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAnyPermission([
    "courses.publish",
    "enrollments.manage"
  ]);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = updateClassSchema.safeParse(body.data);

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
    if (parsed.data.status) {
      const turma = await updateClassStatus(parsed.data.turmaId, parsed.data.status);

      if (!turma) {
        return NextResponse.json(
          { error: "CLASS_NOT_FOUND", message: "Turma não encontrada." },
          { status: 404 }
        );
      }

      await writeAuditLog({
        action: `turma.${parsed.data.status}`,
        entity: "turmas",
        entityId: turma.id,
        summary: `Turma ${turma.nome} alterada para ${turma.status} via API.`
      });

      return NextResponse.json({ data: turma });
    }

    const turma = await updateClassInstructor(
      parsed.data.turmaId,
      parsed.data.instrutorId ?? undefined,
      auth.user.id
    );

    if (!turma) {
      return NextResponse.json(
        { error: "CLASS_NOT_FOUND", message: "Turma não encontrada." },
        { status: 404 }
      );
    }

    await writeAuditLog({
      action: "instrutoria.vinculo_criado",
      entity: "vinculos_instrutoria",
      entityId: turma.id,
      summary: `Instrutor da turma ${turma.nome} atualizado via API.`
    });

    return NextResponse.json({ data: turma });
  } catch (error) {
    if (error instanceof CourseUnavailableForClassError) {
      return NextResponse.json(
        { error: "COURSE_UNAVAILABLE", message: error.message },
        { status: 409 }
      );
    }

    if (error instanceof ClassInstructorError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof ClassStatusError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }
}
