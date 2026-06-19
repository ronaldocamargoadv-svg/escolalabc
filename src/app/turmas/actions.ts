"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireAnyPermission } from "@/lib/auth";
import { removeInstructorAssignment } from "@/lib/instructor-assignments";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";
import {
  ClassInstructorError,
  ClassStatusError,
  CourseUnavailableForClassError,
  createClass,
  updateClassDetails,
  updateClassInstructor,
  updateClassStatus
} from "@/lib/classes";

const createClassSchema = z.object({
  cursoId: z.string().uuid(),
  nome: z.string().min(3),
  dataInicio: z.string().min(10),
  dataFim: z.string().optional(),
  vagas: z.coerce.number().int().nonnegative(),
  modalidade: z.enum(["presencial", "online", "hibrido"]),
  local: z.string().optional(),
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

const updateClassStatusSchema = z.object({
  turmaId: z.string().uuid(),
  status: z.enum(["rascunho", "publicada", "cancelada", "encerrada"])
});

const updateClassDetailsSchema = createClassSchema
  .omit({ cursoId: true })
  .extend({
    turmaId: z.string().uuid()
  });

const updateClassInstructorSchema = z.object({
  turmaId: z.string().uuid(),
  instrutorId: z.string().uuid().optional()
});

export async function createClassAction(formData: FormData) {
  const currentUser = await requireAnyPermission(["courses.publish", "enrollments.manage"]);

  const parsed = createClassSchema.safeParse({
    cursoId: formData.get("cursoId"),
    nome: formData.get("nome"),
    dataInicio: formData.get("dataInicio"),
    dataFim: formData.get("dataFim") || undefined,
    vagas: formData.get("vagas"),
    modalidade: formData.get("modalidade"),
    local: formData.get("local") || undefined,
    linkOnline: formData.get("linkOnline") || undefined,
    criterioFrequenciaMinima: formData.get("criterioFrequenciaMinima") || 75,
    instrutorId: formData.get("instrutorId") || undefined
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar turma.");
  }

  let turma;
  try {
    turma = await createClass(parsed.data, currentUser.id);
  } catch (error) {
    if (error instanceof CourseUnavailableForClassError || error instanceof ClassStatusError) {
      throw new Error(error.message);
    }

    if (error instanceof ClassInstructorError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!turma) {
    throw new Error("Curso não encontrado.");
  }

  await writeAuditLog({
    action: "turma.criada",
    entity: "turmas",
    entityId: turma.id,
    summary: `Turma ${parsed.data.nome} criada.`
  });
  revalidatePath("/turmas");
}

export async function updateClassDetailsAction(formData: FormData) {
  const currentUser = await requireAnyPermission(["courses.publish", "enrollments.manage"]);

  const parsed = updateClassDetailsSchema.safeParse({
    turmaId: formData.get("turmaId"),
    nome: formData.get("nome"),
    dataInicio: formData.get("dataInicio"),
    dataFim: formData.get("dataFim") || undefined,
    vagas: formData.get("vagas"),
    modalidade: formData.get("modalidade"),
    local: formData.get("local") || undefined,
    linkOnline: formData.get("linkOnline") || undefined,
    criterioFrequenciaMinima: formData.get("criterioFrequenciaMinima") || 75,
    instrutorId: formData.get("instrutorId") || undefined
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para editar turma.");
  }

  let turma;
  try {
    turma = await updateClassDetails(parsed.data.turmaId, parsed.data, currentUser.id);
  } catch (error) {
    if (error instanceof ClassStatusError || error instanceof ClassInstructorError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!turma) {
    throw new Error("Turma não encontrada.");
  }

  await writeAuditLog({
    action: "turma.editada",
    entity: "turmas",
    entityId: turma.id,
    summary: `Turma ${turma.nome} editada.`
  });

  revalidatePath("/turmas");
  revalidatePath("/catalogo");
  revalidatePath("/encontros");
  revalidatePath("/materiais");

  const redirectTo = formData.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }
}

export async function updateClassInstructorAction(formData: FormData) {
  const currentUser = await requireAnyPermission(["courses.publish", "enrollments.manage"]);

  const parsed = updateClassInstructorSchema.safeParse({
    turmaId: formData.get("turmaId"),
    instrutorId: formData.get("instrutorId") || undefined
  });

  if (!parsed.success) {
    throw new Error("Instrutor inválido para turma.");
  }

  let turma;
  try {
    turma = await updateClassInstructor(
      parsed.data.turmaId,
      parsed.data.instrutorId,
      currentUser.id
    );
  } catch (error) {
    if (error instanceof ClassInstructorError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!turma) {
    throw new Error("Turma não encontrada.");
  }

  await writeAuditLog({
    action: "instrutoria.vinculo_criado",
    entity: "vinculos_instrutoria",
    entityId: turma.id,
    summary: `Instrutor vinculado à turma ${turma.nome}.`
  });

  revalidatePath("/turmas");
  revalidatePath("/forum");
}

export async function removeInstructorAssignmentAction(formData: FormData) {
  await requireAnyPermission(["courses.publish", "enrollments.manage"]);
  const assignmentId = z.string().uuid().safeParse(formData.get("vinculoId"));
  if (!assignmentId.success) {
    throw new Error("Vínculo de instrutoria inválido.");
  }

  const assignment = await removeInstructorAssignment(assignmentId.data);
  if (!assignment) {
    throw new Error("O vínculo já está encerrado ou não foi encontrado.");
  }

  await writeAuditLog({
    action: "instrutoria.vinculo_encerrado",
    entity: "vinculos_instrutoria",
    entityId: assignment.id,
    summary: "Vínculo de instrutoria encerrado pelo Administrador."
  });
  revalidatePath("/turmas");
  revalidatePath("/");
}

export async function updateClassStatusAction(formData: FormData) {
  await requireAnyPermission(["courses.publish", "enrollments.manage"]);

  const parsed = updateClassStatusSchema.safeParse({
    turmaId: formData.get("turmaId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Status inválido para turma.");
  }

  let turma;
  try {
    turma = await updateClassStatus(parsed.data.turmaId, parsed.data.status);
  } catch (error) {
    if (error instanceof CourseUnavailableForClassError) {
      throw new Error(error.message);
    }

    if (error instanceof ClassStatusError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!turma) {
    throw new Error("Turma não encontrada.");
  }

  await writeAuditLog({
    action: `turma.${parsed.data.status}`,
    entity: "turmas",
    entityId: turma.id,
    summary: `Turma ${turma.nome} alterada para ${turma.status}.`
  });
  if (parsed.data.status === "encerrada" || parsed.data.status === "cancelada") {
    await writeAuditLog({
      action:
        parsed.data.status === "encerrada"
          ? "instrutoria.concluida_automatica"
          : "instrutoria.cancelada_automatica",
      entity: "vinculos_instrutoria",
      summary:
        parsed.data.status === "encerrada"
          ? "Turma concluída. O vínculo de instrutoria foi encerrado."
          : "Turma cancelada. O vínculo de instrutoria foi encerrado."
    });
  }

  revalidatePath("/turmas");
  revalidatePath("/catalogo");
}
