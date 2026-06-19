"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import {
  AttendanceRegistrationError,
  registerAttendance
} from "@/lib/attendance";

const registerAttendanceSchema = z.object({
  inscricaoId: z.string().uuid(),
  encontroId: z.string().uuid(),
  status: z.enum(["presente", "ausente", "justificado"])
});

export async function registerAttendanceAction(formData: FormData) {
  const user = await requirePermission("attendance.manage");

  const parsed = registerAttendanceSchema.safeParse({
    inscricaoId: formData.get("inscricaoId"),
    encontroId: formData.get("encontroId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para registrar presença.");
  }

  let attendance;
  try {
    attendance = await registerAttendance(parsed.data, user);
  } catch (error) {
    if (error instanceof AttendanceRegistrationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: "presenca.registrada",
    entity: "presencas",
    entityId: attendance.id,
    summary: `Presença registrada como ${attendance.status}.`
  });

  revalidatePath("/presencas");
  revalidatePath("/inscricoes");
}
