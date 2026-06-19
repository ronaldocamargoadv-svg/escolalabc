"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { ROLES } from "@/lib/auth";
import {
  InviteError,
  registerUserFromInvite
} from "@/lib/registration-invites";
import { LATTES_INVALID_MESSAGE, normalizeLattesUrl } from "@/lib/lattes";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export type InviteRegistrationState = {
  error?: string;
};

const registrationSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
    nome: z.string().trim().min(3).max(120),
    cpf: z.string().min(11).max(20),
    email: z.string().trim().toLowerCase().email(),
    telefone: z.string().trim().max(30).optional(),
    orgaoSecretaria: z.string().trim().max(160).optional(),
    cargo: z.string().trim().max(120).optional(),
    lattesUrl: z
      .string()
      .trim()
      .max(200)
      .optional()
      .refine((value) => {
        try {
          normalizeLattesUrl(value);
          return true;
        } catch {
          return false;
        }
      }, LATTES_INVALID_MESSAGE),
    senha: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Za-z]/, "A senha deve conter uma letra.")
      .regex(/[0-9]/, "A senha deve conter um número."),
    confirmarSenha: z.string().min(8).max(128),
    aceitarTermos: z.literal("on")
  })
  .refine((value) => value.senha === value.confirmarSenha, {
    message: "As senhas informadas não conferem.",
    path: ["confirmarSenha"]
  });

export async function invitationRegistrationAction(
  _state: InviteRegistrationState,
  formData: FormData
) {
  const parsed = registrationSchema.safeParse({
    token: formData.get("token"),
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    telefone: formData.get("telefone") || undefined,
    orgaoSecretaria: formData.get("orgaoSecretaria") || undefined,
    cargo: formData.get("cargo") || undefined,
    lattesUrl: formData.get("lattesUrl") || undefined,
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
    aceitarTermos: formData.get("aceitarTermos")
  });

  if (!parsed.success) {
    const lattesError = parsed.error.flatten().fieldErrors.lattesUrl?.[0];
    return {
      error: lattesError ??
        "Confira os dados. A senha deve ter ao menos 8 caracteres, uma letra e um número."
    };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || "local";
  const rateLimitKey = `invite-registration:${ip}:${parsed.data.email}`;
  const rateLimit = checkRateLimit({
    key: rateLimitKey,
    limit: 5,
    windowMs: 15 * 60 * 1000
  });

  if (!rateLimit.allowed) {
    return {
      error: "Muitas tentativas de cadastro. Aguarde antes de tentar novamente."
    };
  }

  let registration;
  try {
    registration = await registerUserFromInvite({
      token: parsed.data.token,
      name: parsed.data.nome,
      cpf: parsed.data.cpf,
      email: parsed.data.email,
      password: parsed.data.senha,
      phone: parsed.data.telefone,
      organization: parsed.data.orgaoSecretaria,
      position: parsed.data.cargo,
      lattesUrl: parsed.data.lattesUrl,
      ipAddress: ip,
      userAgent: requestHeaders.get("user-agent") ?? undefined
    });
  } catch (error) {
    if (error instanceof InviteError) {
      await writeAuditLog({
        action: "convite.tentativa_bloqueada",
        entity: "convites_cadastro",
        entityId: error.inviteId,
        summary: `Tentativa de cadastro bloqueada: ${error.code}.`,
        ip
      });
      return { error: error.message };
    }

    throw error;
  }

  clearRateLimit(rateLimitKey);
  await writeAuditLog({
    userId: registration.user.id,
    action: "convite.usado",
    entity: "convites_cadastro",
    entityId: registration.inviteId,
    summary: `Cadastro concluído para perfil ${registration.role}.`,
    ip
  });
  await writeAuditLog({
    userId: registration.user.id,
    action: "usuario.criado_convite",
    entity: "usuarios",
    entityId: registration.user.id,
    summary: `Usuário cadastrado por convite com perfil ${registration.role}.`,
    ip
  });

  await setSessionCookie(
    createSessionToken({
      userId: registration.user.id,
      email: registration.user.email
    })
  );

  redirect(registration.role === ROLES.participante ? "/minha-area" : "/");
}
