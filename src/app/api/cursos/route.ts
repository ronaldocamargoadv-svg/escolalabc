import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { CourseStatusError, listCourses, updateCourseStatus } from "@/lib/courses";
import { getDb } from "@/lib/db";

const createCourseSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  descricao: z.string().trim().max(1000).optional(),
  objetivos: z.string().trim().max(1500).optional(),
  ementa: z.string().trim().min(3).max(4000),
  cargaHoraria: z.coerce.number().positive(),
  modalidade: z.enum(["presencial", "online", "hibrido"]),
  publicoAlvo: z.string().trim().max(500).optional(),
  tema: z.string().trim().max(120).optional(),
  status: z.enum(["rascunho", "publicado", "arquivado"]).default("rascunho")
}).strict();

const updateCourseStatusSchema = z.object({
  cursoId: z.string().uuid(),
  status: z.enum(["rascunho", "publicado", "arquivado"])
}).strict();

export async function GET() {
  const auth = await requireApiPermission("courses.view");
  if (auth.response) return auth.response;

  const courses = await listCourses(auth.user);

  return NextResponse.json({ data: courses });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("courses.create");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = createCourseSchema.safeParse(body.data);

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

  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO cursos (
        id, nome, descricao, objetivos, ementa, carga_horaria, modalidade,
        publico_alvo, tema, status, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      RETURNING *
    `,
    [
      parsed.data.nome,
      parsed.data.descricao,
      parsed.data.objetivos,
      parsed.data.ementa,
      parsed.data.cargaHoraria,
      parsed.data.modalidade,
      parsed.data.publicoAlvo,
      parsed.data.tema,
      parsed.data.status
    ]
  );
  const course = result.rows[0];

  await writeAuditLog({
    action: "curso.criado",
    entity: "cursos",
    entityId: course.id,
    summary: `Curso ${course.nome} criado via API.`
  });

  return NextResponse.json({ data: course }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireApiPermission("courses.publish");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = updateCourseStatusSchema.safeParse(body.data);

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

  let course;
  try {
    course = await updateCourseStatus(parsed.data.cursoId, parsed.data.status);
  } catch (error) {
    if (error instanceof CourseStatusError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  if (!course) {
    return NextResponse.json(
      { error: "COURSE_NOT_FOUND", message: "Curso não encontrado." },
      { status: 404 }
    );
  }

  await writeAuditLog({
    action: `curso.${parsed.data.status}`,
    entity: "cursos",
    entityId: course.id,
    summary: `Curso ${course.nome} alterado para ${course.status} via API.`
  });

  return NextResponse.json({ data: course });
}
