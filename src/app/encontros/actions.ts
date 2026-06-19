"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";
import {
  createMeeting,
  MeetingCreationError,
  MeetingStatusError,
  updateMeetingDetails,
  updateMeetingStatus
} from "@/lib/meetings";

const createMeetingSchema = z.object({
  turmaId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/),
  modalidade: z.enum(["presencial", "online", "hibrido"]),
  local: z.string().optional(),
  linkOnline: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE)
    .optional()
});

const updateMeetingStatusSchema = z.object({
  encontroId: z.string().uuid(),
  status: z.enum(["previsto", "realizado", "cancelado"])
});

const updateMeetingDetailsSchema = createMeetingSchema
  .omit({ turmaId: true })
  .extend({
    encontroId: z.string().uuid()
  });

export async function createMeetingAction(formData: FormData) {
  const user = await requirePermission("classes.create");

  const parsed = createMeetingSchema.safeParse({
    turmaId: formData.get("turmaId"),
    data: formData.get("data"),
    horarioInicio: formData.get("horarioInicio"),
    horarioFim: formData.get("horarioFim"),
    modalidade: formData.get("modalidade"),
    local: formData.get("local") || undefined,
    linkOnline: formData.get("linkOnline") || undefined
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar encontro.");
  }

  let meeting;
  try {
    meeting = await createMeeting(parsed.data, user);
  } catch (error) {
    if (error instanceof MeetingCreationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: "encontro.criado",
    entity: "encontros",
    entityId: meeting.id,
    summary: `Encontro criado para ${parsed.data.data}.`
  });

  revalidatePath("/encontros");
}

export async function updateMeetingDetailsAction(formData: FormData) {
  const user = await requirePermission("classes.edit");

  const parsed = updateMeetingDetailsSchema.safeParse({
    encontroId: formData.get("encontroId"),
    data: formData.get("data"),
    horarioInicio: formData.get("horarioInicio"),
    horarioFim: formData.get("horarioFim"),
    modalidade: formData.get("modalidade"),
    local: formData.get("local") || undefined,
    linkOnline: formData.get("linkOnline") || undefined
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para editar encontro.");
  }

  let meeting;
  try {
    meeting = await updateMeetingDetails(parsed.data.encontroId, parsed.data, user);
  } catch (error) {
    if (error instanceof MeetingStatusError || error instanceof MeetingCreationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!meeting) {
    throw new Error("Encontro não encontrado.");
  }

  await writeAuditLog({
    action: "encontro.editado",
    entity: "encontros",
    entityId: meeting.id,
    summary: "Encontro editado."
  });

  revalidatePath("/encontros");
  revalidatePath("/presencas");
  revalidatePath("/catalogo");
}

export async function updateMeetingStatusAction(formData: FormData) {
  const user = await requirePermission("classes.edit");

  const parsed = updateMeetingStatusSchema.safeParse({
    encontroId: formData.get("encontroId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Status inválido para encontro.");
  }

  let meeting;
  try {
    meeting = await updateMeetingStatus(
      parsed.data.encontroId,
      parsed.data.status,
      user
    );
  } catch (error) {
    if (error instanceof MeetingStatusError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: `encontro.${meeting.status}`,
    entity: "encontros",
    entityId: meeting.id,
    summary: `Encontro alterado para ${meeting.status}.`
  });

  revalidatePath("/encontros");
  revalidatePath("/presencas");
}
