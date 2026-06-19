"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import {
  createManagedEnrollment,
  EnrollmentError,
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

export async function createEnrollmentAction(formData: FormData) {
  await requirePermission("enrollments.manage");

  const parsed = createEnrollmentSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    turmaId: formData.get("turmaId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para inscrição.");
  }

  let enrollment;
  try {
    enrollment = await createManagedEnrollment({
      ...parsed.data,
      origem: "gestao"
    });
  } catch (error) {
    if (error instanceof EnrollmentError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: "inscricao.criada",
    entity: "inscricoes",
    entityId: enrollment.id,
    summary: "Inscrição registrada ou reativada."
  });

  revalidatePath("/inscricoes");
  revalidatePath("/catalogo");
  revalidatePath("/minha-area");
}

export async function updateEnrollmentStatusAction(formData: FormData) {
  await requirePermission("enrollments.manage");

  const parsed = updateEnrollmentStatusSchema.safeParse({
    inscricaoId: formData.get("inscricaoId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Status inválido para inscrição.");
  }

  let enrollment;
  try {
    enrollment = await updateEnrollmentStatus(
      parsed.data.inscricaoId,
      parsed.data.status
    );
  } catch (error) {
    if (error instanceof EnrollmentError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action:
      parsed.data.status === "cancelado"
        ? "inscricao.cancelada_gestao"
        : "inscricao.reativada_gestao",
    entity: "inscricoes",
    entityId: enrollment.id,
    summary: `Inscrição na turma ${enrollment.turma} alterada para ${enrollment.status}.`
  });

  revalidatePath("/inscricoes");
  revalidatePath("/catalogo");
  revalidatePath("/minha-area");
}
