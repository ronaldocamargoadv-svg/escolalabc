"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import {
  allPermissions,
  createProfile,
  deleteCustomProfile,
  ProfileMutationError,
  updateProfilePermissions
} from "@/lib/permissions";

const createProfileSchema = z.object({
  nome: z.string().trim().min(3).max(80),
  descricao: z.string().trim().max(240).optional(),
  permissoes: z.array(z.enum(allPermissions as [string, ...string[]])).default([])
});

const updateProfilePermissionsSchema = z.object({
  perfilId: z.string().uuid(),
  permissoes: z.array(z.enum(allPermissions as [string, ...string[]])).default([])
});

const deleteProfileSchema = z.object({
  perfilId: z.string().uuid()
});

function permissionsFromForm(formData: FormData) {
  return formData.getAll("permissoes").map(String);
}

export async function createProfileAction(formData: FormData) {
  const user = await requirePermission("roles.create");
  await requirePermission("permissions.manage");

  const parsed = createProfileSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    permissoes: permissionsFromForm(formData)
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar perfil.");
  }

  let profile;
  try {
    profile = await createProfile(parsed.data);
  } catch (error) {
    if (error instanceof ProfileMutationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    userId: user.id,
    action: "perfil.criado",
    entity: "perfis",
    entityId: profile.id,
    summary: `Perfil ${profile.nome} criado com permissões personalizadas.`
  });

  revalidatePath("/perfis");
}

export async function updateProfilePermissionsAction(formData: FormData) {
  const user = await requirePermission("permissions.manage");
  const parsed = updateProfilePermissionsSchema.safeParse({
    perfilId: formData.get("perfilId"),
    permissoes: permissionsFromForm(formData)
  });

  if (!parsed.success) {
    throw new Error("Permissões inválidas para perfil.");
  }

  await updateProfilePermissions(parsed.data.perfilId, parsed.data.permissoes);

  await writeAuditLog({
    userId: user.id,
    action: "perfil.permissoes_alteradas",
    entity: "perfis",
    entityId: parsed.data.perfilId,
    summary: "Permissões do perfil alteradas."
  });

  revalidatePath("/perfis");
}

export async function deleteProfileAction(formData: FormData) {
  const user = await requirePermission("roles.delete");
  const parsed = deleteProfileSchema.safeParse({
    perfilId: formData.get("perfilId")
  });

  if (!parsed.success) {
    throw new Error("Perfil inválido para exclusão.");
  }

  let profile;
  try {
    profile = await deleteCustomProfile(parsed.data.perfilId);
  } catch (error) {
    if (error instanceof ProfileMutationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!profile) {
    throw new Error("Apenas perfis personalizados podem ser excluídos.");
  }

  await writeAuditLog({
    userId: user.id,
    action: "perfil.excluido",
    entity: "perfis",
    entityId: profile.id,
    summary: `Perfil personalizado ${profile.nome} excluído.`
  });

  revalidatePath("/perfis");
}
