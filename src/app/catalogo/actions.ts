"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { enrollCurrentUserInClass } from "@/lib/catalog";

const selfEnrollmentSchema = z.object({
  turmaId: z.string().uuid()
});

export async function selfEnrollAction(formData: FormData) {
  const user = await requirePermission("enrollments.create");
  const parsed = selfEnrollmentSchema.safeParse({
    turmaId: formData.get("turmaId")
  });

  if (!parsed.success) {
    throw new Error("Turma inválida para inscrição.");
  }

  const enrollment = await enrollCurrentUserInClass(user.id, parsed.data.turmaId);

  await writeAuditLog({
    action: "inscricao.autoinscricao",
    entity: "inscricoes",
    entityId: enrollment.id,
    summary: "Autoinscrição registrada pelo aluno."
  });

  revalidatePath("/catalogo");
  revalidatePath("/minha-area");
}
