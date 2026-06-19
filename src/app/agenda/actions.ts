"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireAnyPermission, requirePermission } from "@/lib/auth";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";
import {
  calendarEventTypes,
  createCalendarEvent,
  deleteCalendarEvent,
  saveCalendarIntegrationSettings,
  updateCalendarEvent,
  updateCalendarEventStatus,
  type CalendarVisibility
} from "@/lib/calendar";

const eventSchema = z.object({
  titulo: z.string().trim().min(3).max(140),
  descricao: z.string().trim().max(800).optional(),
  tipo: z.enum(calendarEventTypes),
  inicioEm: z.string().min(10),
  fimEm: z.string().min(10),
  local: z.string().trim().max(160).optional(),
  linkOnline: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE)
    .optional()
    .or(z.literal("")),
  turmaId: z.string().uuid().optional().or(z.literal("")),
  visibilidade: z.enum(["private", "course", "class", "institutional"]),
  lembreteMinutos: z.coerce.number().int().min(0).max(10080).nullable(),
  sincronizar: z.boolean()
});

const eventIdSchema = z.string().uuid();

function parseEvent(formData: FormData) {
  const reminderValue = formData.get("lembreteMinutos");
  return eventSchema.parse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    tipo: formData.get("tipo"),
    inicioEm: formData.get("inicioEm"),
    fimEm: formData.get("fimEm"),
    local: formData.get("local") || undefined,
    linkOnline: formData.get("linkOnline") || undefined,
    turmaId: formData.get("turmaId") || undefined,
    visibilidade: formData.get("visibilidade"),
    lembreteMinutos:
      reminderValue === null || reminderValue === "" ? null : reminderValue,
    sincronizar: formData.get("sincronizar") === "on"
  });
}

export async function createCalendarEventAction(formData: FormData) {
  const user = await requireAnyPermission([
    "calendar.create_own",
    "calendar.create_class_event",
    "calendar.create_institutional"
  ]);
  const data = parseEvent(formData);
  const event = await createCalendarEvent(
    {
      title: data.titulo,
      description: data.descricao,
      type: data.tipo,
      startDateTime: data.inicioEm,
      endDateTime: data.fimEm,
      location: data.local,
      onlineLink: data.linkOnline || undefined,
      classGroupId: data.turmaId || undefined,
      visibility: data.visibilidade as CalendarVisibility,
      reminderMinutes: data.lembreteMinutos,
      syncEnabled: data.sincronizar
    },
    user
  );
  await writeAuditLog({
    action: "agenda.evento_criado",
    entity: "eventos_agenda",
    entityId: event.id,
    summary: `Evento criado: ${event.titulo}.`
  });
  revalidatePath("/agenda");
}

export async function updateCalendarEventAction(formData: FormData) {
  const user = await requireAnyPermission([
    "calendar.edit_own",
    "calendar.edit_class_event",
    "calendar.edit_institutional"
  ]);
  const id = eventIdSchema.parse(formData.get("eventoId"));
  const data = parseEvent(formData);
  const event = await updateCalendarEvent(
    id,
    {
      title: data.titulo,
      description: data.descricao,
      type: data.tipo,
      startDateTime: data.inicioEm,
      endDateTime: data.fimEm,
      location: data.local,
      onlineLink: data.linkOnline || undefined,
      classGroupId: data.turmaId || undefined,
      visibility: data.visibilidade as CalendarVisibility,
      reminderMinutes: data.lembreteMinutos,
      syncEnabled: data.sincronizar
    },
    user
  );
  await writeAuditLog({
    action: "agenda.evento_editado",
    entity: "eventos_agenda",
    entityId: event.id,
    summary: `Evento editado: ${event.titulo}.`
  });
  revalidatePath("/agenda");
}

export async function updateCalendarEventStatusAction(formData: FormData) {
  const user = await requireAnyPermission([
    "calendar.edit_own",
    "calendar.edit_class_event",
    "calendar.edit_institutional"
  ]);
  const id = eventIdSchema.parse(formData.get("eventoId"));
  const status = z.enum(["scheduled", "completed", "cancelled"]).parse(
    formData.get("status")
  );
  const event = await updateCalendarEventStatus(id, status, user);
  await writeAuditLog({
    action:
      status === "cancelled"
        ? "agenda.evento_cancelado"
        : "agenda.evento_editado",
    entity: "eventos_agenda",
    entityId: event.id,
    summary: `Status de evento atualizado: ${event.titulo}.`
  });
  revalidatePath("/agenda");
}

export async function deleteCalendarEventAction(formData: FormData) {
  const user = await requireAnyPermission([
    "calendar.delete_own",
    "calendar.delete_institutional",
    "calendar.edit_class_event"
  ]);
  const id = eventIdSchema.parse(formData.get("eventoId"));
  const event = await deleteCalendarEvent(id, user);
  await writeAuditLog({
    action: "agenda.evento_excluido",
    entity: "eventos_agenda",
    entityId: event.id,
    summary: `Evento excluído: ${event.titulo}.`
  });
  revalidatePath("/agenda");
}

export async function saveCalendarIntegrationAction(formData: FormData) {
  const user = await requirePermission("calendar.integration_configure");
  const settings = z
    .object({
      provider: z.enum(["none", "google", "outlook", "apple", "ics"]),
      enabled: z.boolean(),
      autoSyncCourseEvents: z.boolean(),
      autoSyncPersonalEvents: z.boolean()
    })
    .parse({
      provider: formData.get("provedor"),
      enabled: formData.get("habilitada") === "on",
      autoSyncCourseEvents: formData.get("sincronizarEventosCurso") === "on",
      autoSyncPersonalEvents: formData.get("sincronizarEventosPessoais") === "on"
    });
  await saveCalendarIntegrationSettings(
    {
      ...settings,
      syncDirection: "export_only"
    },
    user
  );
  await writeAuditLog({
    action: "agenda.integracao_configurada",
    entity: "configuracoes_integracao_agenda",
    summary: settings.enabled
      ? `Integração opcional selecionada: ${settings.provider}.`
      : "Agenda mantida apenas dentro da Escola LaBC."
  });
  revalidatePath("/agenda");
}
