"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireCurrentUser } from "@/lib/auth";
import { LattesValidationError } from "@/lib/lattes";
import { changeOwnPassword, updateOwnLattesUrl } from "@/lib/profile";

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

export type UpdateLattesState = {
  error?: string;
  success?: string;
};

const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    novaSenha: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha.")
  })
  .refine((value) => value.novaSenha === value.confirmarSenha, {
    message: "A confirmação não confere.",
    path: ["confirmarSenha"]
  });

export async function changePasswordAction(
  _state: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireCurrentUser();
  const parsed = changePasswordSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha")
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find(Boolean);

    return { error: firstError ?? "Dados inválidos." };
  }

  try {
    await changeOwnPassword({
      userId: user.id,
      currentPassword: parsed.data.senhaAtual,
      newPassword: parsed.data.novaSenha
    });

    await writeAuditLog({
      action: "usuario.senha_alterada",
      entity: "usuarios",
      entityId: user.id,
      summary: "Senha alterada pelo próprio usuário."
    });

    return { success: "Senha atualizada com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha."
    };
  }
}

export async function updateLattesAction(
  _state: UpdateLattesState,
  formData: FormData
): Promise<UpdateLattesState> {
  const user = await requireCurrentUser();

  try {
    await updateOwnLattesUrl(user.id, String(formData.get("lattesUrl") ?? ""));
    await writeAuditLog({
      userId: user.id,
      action: "usuario.lattes_atualizado",
      entity: "usuarios",
      entityId: user.id,
      summary: "Link do Currículo Lattes atualizado pelo próprio usuário."
    });
    revalidatePath("/perfil");

    return { success: "Link do Currículo Lattes salvo com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof LattesValidationError
          ? error.message
          : "Não foi possível salvar o link do Currículo Lattes."
    };
  }
}
