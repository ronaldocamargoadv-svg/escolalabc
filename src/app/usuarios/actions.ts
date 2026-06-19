"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { LattesValidationError } from "@/lib/lattes";
import {
  createUser,
  resetUserTemporaryPassword,
  setUserProfiles,
  updateUserStatus,
  updateUserLattesUrl,
  UserCreationError
} from "@/lib/users";

const createUserSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().min(11),
  email: z.string().email(),
  perfil: z.string().min(1),
  lattesUrl: z.string().trim().max(200).optional()
  ,
  turmaId: z.string().uuid().optional()
});

const updateUserStatusSchema = z.object({
  usuarioId: z.string().uuid(),
  status: z.enum(["ativo", "inativo"])
});

const resetUserPasswordSchema = z.object({
  usuarioId: z.string().uuid()
});

const setUserProfilesSchema = z.object({
  usuarioId: z.string().uuid(),
  perfilIds: z.array(z.string().uuid()).min(1)
});

const updateUserLattesSchema = z.object({
  usuarioId: z.string().uuid(),
  lattesUrl: z.string().trim().max(200).optional()
});

export type UpdateUserLattesState = {
  error?: string;
  success?: string;
};

export type CreateUserState = {
  error?: string;
  success?: string;
  temporaryCredentials?: { email: string; password: string };
};

export type ResetUserPasswordState = {
  error?: string;
  success?: string;
  temporaryPassword?: string;
};

export async function createUserAction(
  _state: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const currentUser = await requirePermission("users.create");

  const parsed = createUserSchema.safeParse({
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    perfil: formData.get("perfil"),
    lattesUrl: String(formData.get("lattesUrl") ?? "") || undefined,
    turmaId: String(formData.get("turmaId") ?? "") || undefined
  });

  if (!parsed.success) {
    return { error: "Dados inválidos para criar usuário." };
  }

  let user;
  try {
    user = await createUser(parsed.data, currentUser.id);
  } catch (error) {
    if (error instanceof UserCreationError) {
      return { error: error.message };
    }

    throw error;
  }

  await writeAuditLog({
    action: "usuario.criado",
    entity: "usuarios",
    entityId: user.id,
    summary: `Usuário ${user.email} criado.`
  });

  revalidatePath("/usuarios");
  return {
    success: "Usuário criado. Entregue a senha temporária de forma segura.",
    temporaryCredentials: {
      email: user.email,
      password: user.senhaTemporaria
    }
  };
}

export async function updateUserLattesAction(
  _state: UpdateUserLattesState,
  formData: FormData
): Promise<UpdateUserLattesState> {
  const currentUser = await requirePermission("users.edit");
  const parsed = updateUserLattesSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    lattesUrl: String(formData.get("lattesUrl") ?? "") || undefined
  });

  if (!parsed.success) {
    return { error: "Dados inválidos para atualizar o Currículo Lattes." };
  }

  let user;
  try {
    user = await updateUserLattesUrl(parsed.data.usuarioId, parsed.data.lattesUrl);
  } catch (error) {
    if (error instanceof LattesValidationError) {
      return { error: error.message };
    }

    throw error;
  }

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "usuario.lattes_atualizado",
    entity: "usuarios",
    entityId: user.id,
    summary: `Currículo Lattes de ${user.email} atualizado pelo Administrador.`
  });

  revalidatePath("/usuarios");
  return { success: "Link do Currículo Lattes salvo com sucesso." };
}

export async function updateUserStatusAction(formData: FormData) {
  const currentUser = await requirePermission("users.edit");
  const parsed = updateUserStatusSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Status inválido para usuário.");
  }

  if (parsed.data.usuarioId === currentUser.id && parsed.data.status === "inativo") {
    throw new Error("Você não pode inativar a própria conta.");
  }

  let user;
  try {
    user = await updateUserStatus(
      parsed.data.usuarioId,
      parsed.data.status,
      currentUser.id
    );
  } catch (error) {
    if (error instanceof UserCreationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  await writeAuditLog({
    action: `usuario.${parsed.data.status}`,
    entity: "usuarios",
    entityId: user.id,
    summary: `Usuário ${user.email} alterado para ${user.status}.`
  });

  revalidatePath("/usuarios");
}

export async function resetUserPasswordAction(
  _state: ResetUserPasswordState,
  formData: FormData
): Promise<ResetUserPasswordState> {
  await requirePermission("users.edit");
  const parsed = resetUserPasswordSchema.safeParse({
    usuarioId: formData.get("usuarioId")
  });

  if (!parsed.success) {
    return { error: "Usuário inválido para redefinição de senha." };
  }

  const user = await resetUserTemporaryPassword(parsed.data.usuarioId);

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  await writeAuditLog({
    action: "usuario.senha_redefinida",
    entity: "usuarios",
    entityId: user.id,
    summary: `Senha de ${user.email} redefinida para senha temporária.`
  });

  revalidatePath("/usuarios");
  return {
    success: "Senha temporária gerada. Compartilhe-a somente com o usuário correspondente.",
    temporaryPassword: user.senhaTemporaria
  };
}

export async function setUserProfilesAction(formData: FormData) {
  const currentUser = await requirePermission("users.edit");
  const parsed = setUserProfilesSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    perfilIds: formData.getAll("perfilIds").map(String)
  });

  if (!parsed.success) {
    throw new Error("Selecione ao menos um perfil para o usuário.");
  }

  let user;
  try {
    user = await setUserProfiles(
      parsed.data.usuarioId,
      parsed.data.perfilIds,
      currentUser.id
    );
  } catch (error) {
    if (error instanceof UserCreationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "usuario.perfis_alterados",
    entity: "usuarios",
    entityId: user.id,
    summary: `Perfis de ${user.email} atualizados.`
  });

  revalidatePath("/usuarios");
}
