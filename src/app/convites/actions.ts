"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireCurrentUser } from "@/lib/auth";
import {
  createRegistrationInvite,
  InviteError,
  inviteRoles,
  revokeRegistrationInvite
} from "@/lib/registration-invites";

const createSchema = z.object({
  perfil: z.enum(inviteRoles),
  tipoUso: z.enum(["unico", "multiplo"]),
  limiteUsos: z.coerce.number().int().min(1).max(100).default(1),
  validadeHoras: z.coerce.number().int().min(1).max(720),
  emailConvidado: z.string().trim().email().optional().or(z.literal("")),
  observacao: z.string().trim().max(280).optional().or(z.literal("")),
  confirmarAdministrativo: z.boolean()
  ,
  turmaInstrutoriaId: z.string().uuid().optional()
});

function errorRedirect(error: unknown): never {
  const message =
    error instanceof InviteError
      ? error.message
      : "Não foi possível concluir esta operação.";
  redirect(`/convites?erro=${encodeURIComponent(message)}`);
}

export async function createRegistrationInviteAction(formData: FormData) {
  const user = await requireCurrentUser();
  const parsed = createSchema.safeParse({
    perfil: formData.get("perfil"),
    tipoUso: formData.get("tipoUso"),
    limiteUsos: formData.get("limiteUsos") || 1,
    validadeHoras: formData.get("validadeHoras"),
    emailConvidado: formData.get("emailConvidado") || undefined,
    observacao: formData.get("observacao") || undefined,
    confirmarAdministrativo: formData.get("confirmarAdministrativo") === "on",
    turmaInstrutoriaId: formData.get("turmaInstrutoriaId") || undefined
  });

  if (!parsed.success) {
    redirect("/convites?erro=Confira%20os%20dados%20do%20convite.");
  }

  try {
    const invite = await createRegistrationInvite(
      {
        role: parsed.data.perfil,
        maxUses: parsed.data.tipoUso === "unico" ? 1 : parsed.data.limiteUsos,
        expiresInHours: parsed.data.validadeHoras,
        invitedEmail: parsed.data.emailConvidado || undefined,
        notes: parsed.data.observacao || undefined,
        confirmedAdministrativeRisk: parsed.data.confirmarAdministrativo,
        turmaInstrutoriaId: parsed.data.turmaInstrutoriaId
      },
      user
    );

    await writeAuditLog({
      action:
        invite.role === "administrador_geral"
          ? "convite.administrador_criado"
          : "convite.criado",
      entity: "convites_cadastro",
      entityId: invite.id,
      summary: `Link criado para perfil ${invite.role}, limite de ${invite.maxUses} uso(s).`
    });
  } catch (error) {
    errorRedirect(error);
  }

  revalidatePath("/convites");
  redirect("/convites?sucesso=Link%20gerado%20com%20seguran%C3%A7a.");
}

export async function revokeRegistrationInviteAction(formData: FormData) {
  const user = await requireCurrentUser();
  const id = z.string().uuid().safeParse(formData.get("conviteId"));

  if (!id.success) {
    redirect("/convites?erro=Link%20inv%C3%A1lido.");
  }

  try {
    const invite = await revokeRegistrationInvite(id.data, user);
    await writeAuditLog({
      action: "convite.revogado",
      entity: "convites_cadastro",
      entityId: invite.id,
      summary: `Link revogado para perfil ${invite.perfil_atribuido}.`
    });
  } catch (error) {
    errorRedirect(error);
  }

  revalidatePath("/convites");
  redirect("/convites?sucesso=Link%20revogado.");
}
