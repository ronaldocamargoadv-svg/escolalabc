"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateUser } from "@/lib/login";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Informe e-mail e senha." };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || "local";
  const rateLimitKey = `login:form:${ip}:${email}`;
  const rateLimit = checkRateLimit({
    key: rateLimitKey,
    limit: 5,
    windowMs: 15 * 60 * 1000
  });

  if (!rateLimit.allowed) {
    return {
      error: "Muitas tentativas de login. Aguarde antes de tentar novamente."
    };
  }

  const auth = await authenticateUser(email, senha);

  if (!auth) {
    return { error: "Credenciais inválidas." };
  }

  clearRateLimit(rateLimitKey);
  await setSessionCookie(auth.token);

  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
