import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiUser } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { changeOwnPassword, PasswordChangeError } from "@/lib/profile";

const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8)
});

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = changePasswordSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    await changeOwnPassword({
      userId: auth.user.id,
      currentPassword: parsed.data.senhaAtual,
      newPassword: parsed.data.novaSenha
    });

    await writeAuditLog({
      action: "usuario.senha_alterada",
      entity: "usuarios",
      entityId: auth.user.id,
      summary: "Senha alterada pelo próprio usuário via API."
    });

    return NextResponse.json({
      data: {
        ok: true
      }
    });
  } catch (error) {
    if (error instanceof PasswordChangeError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: "PASSWORD_CHANGE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível alterar a senha."
      },
      { status: 422 }
    );
  }
}
