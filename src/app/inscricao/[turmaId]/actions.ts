"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import {
  PublicRegistrationError,
  registerParticipantForClass
} from "@/lib/public-registration";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export type PublicRegistrationState = {
  error?: string;
};

const publicRegistrationSchema = z
  .object({
    turmaId: z.string().uuid(),
    nome: z.string().trim().min(3).max(120),
    cpf: z.string().min(11).max(20),
    email: z.string().trim().toLowerCase().email(),
    senha: z.string().min(8).max(128),
    confirmarSenha: z.string().min(8).max(128)
  })
  .refine((value) => value.senha === value.confirmarSenha, {
    message: "As senhas informadas não conferem.",
    path: ["confirmarSenha"]
  });

export async function publicRegistrationAction(
  _state: PublicRegistrationState,
  formData: FormData
) {
  const parsed = publicRegistrationSchema.safeParse({
    turmaId: formData.get("turmaId"),
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha")
  });

  if (!parsed.success) {
    return { error: "Confira os dados informados para concluir a inscrição." };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || "local";
  const rateLimitKey = `public-registration:${ip}:${parsed.data.email}`;
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

  let user;
  try {
    user = await registerParticipantForClass(parsed.data);
  } catch (error) {
    if (error instanceof PublicRegistrationError) {
      return { error: error.message };
    }

    throw error;
  }

  clearRateLimit(rateLimitKey);

  await writeAuditLog({
    userId: user.id,
    action: "inscricao.link_publico",
    entity: "inscricoes",
    summary: `Usuário ${user.email} cadastrado por link público de inscrição.`
  });

  await setSessionCookie(
    createSessionToken({
      userId: user.id,
      email: user.email
    })
  );

  redirect("/minha-area");
}
