"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireCurrentUser } from "@/lib/auth";
import { cancelMyEnrollment } from "@/lib/my-area";

const cancelEnrollmentSchema = z.object({
  inscricaoId: z.string().uuid()
});

export async function cancelMyEnrollmentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const parsed = cancelEnrollmentSchema.safeParse({
    inscricaoId: formData.get("inscricaoId")
  });

  if (!parsed.success) {
    throw new Error("Inscrição inválida para cancelamento.");
  }

  const enrollment = await cancelMyEnrollment(user.id, parsed.data.inscricaoId);

  await writeAuditLog({
    action: "inscricao.cancelada_participante",
    entity: "inscricoes",
    entityId: enrollment.id,
    summary: `Inscrição na turma ${enrollment.turma} cancelada pelo aluno.`
  });

  revalidatePath("/minha-area");
  revalidatePath("/catalogo");
}
