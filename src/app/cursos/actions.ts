"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import {
  CourseStatusError,
  updateCourseDetails,
  updateCourseStatus
} from "@/lib/courses";

const createCourseSchema = z.object({
  nome: z.string().min(3),
  modalidade: z.enum(["presencial", "online", "hibrido"]),
  cargaHoraria: z.coerce.number().positive(),
  vagas: z.coerce.number().int().nonnegative().optional(),
  ementa: z.string().min(3),
  tema: z.string().optional()
});

const updateCourseStatusSchema = z.object({
  cursoId: z.string().uuid(),
  status: z.enum(["rascunho", "publicado", "arquivado"])
});

const updateCourseDetailsSchema = createCourseSchema.extend({
  cursoId: z.string().uuid()
});

export async function createCourseAction(formData: FormData) {
  await requirePermission("courses.create");

  const parsed = createCourseSchema.safeParse({
    nome: formData.get("nome"),
    modalidade: formData.get("modalidade"),
    cargaHoraria: formData.get("cargaHoraria"),
    vagas: formData.get("vagas"),
    ementa: formData.get("ementa"),
    tema: formData.get("tema")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar curso.");
  }

  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO cursos (
        id, nome, ementa, carga_horaria, modalidade, tema, status, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'rascunho', now())
      RETURNING id
    `,
    [
      parsed.data.nome,
      parsed.data.ementa,
      parsed.data.cargaHoraria,
      parsed.data.modalidade,
      parsed.data.tema || null
    ]
  );
  const course = result.rows[0];

  await writeAuditLog({
    action: "curso.criado",
    entity: "cursos",
    entityId: course.id,
    summary: `Curso ${parsed.data.nome} criado como rascunho.`
  });

  revalidatePath("/cursos");
}

export async function updateCourseDetailsAction(formData: FormData) {
  await requirePermission("courses.edit");

  const parsed = updateCourseDetailsSchema.safeParse({
    cursoId: formData.get("cursoId"),
    nome: formData.get("nome"),
    modalidade: formData.get("modalidade"),
    cargaHoraria: formData.get("cargaHoraria"),
    vagas: formData.get("vagas"),
    ementa: formData.get("ementa"),
    tema: formData.get("tema")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para editar curso.");
  }

  const course = await updateCourseDetails(parsed.data.cursoId, parsed.data);

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  await writeAuditLog({
    action: "curso.editado",
    entity: "cursos",
    entityId: course.id,
    summary: `Curso ${course.nome} editado.`
  });

  revalidatePath("/cursos");
  revalidatePath("/catalogo");
  revalidatePath("/");

  const redirectTo = formData.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }
}

export async function updateCourseStatusAction(formData: FormData) {
  await requirePermission("courses.publish");

  const parsed = updateCourseStatusSchema.safeParse({
    cursoId: formData.get("cursoId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Status inválido para curso.");
  }

  let course;
  try {
    course = await updateCourseStatus(parsed.data.cursoId, parsed.data.status);
  } catch (error) {
    if (error instanceof CourseStatusError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  await writeAuditLog({
    action: `curso.${parsed.data.status}`,
    entity: "cursos",
    entityId: course.id,
    summary: `Curso ${course.nome} alterado para ${course.status}.`
  });

  revalidatePath("/cursos");
  revalidatePath("/");
}
