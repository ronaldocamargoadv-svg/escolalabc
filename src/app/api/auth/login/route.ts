import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, readJsonBody } from "@/lib/api";
import { authenticateUser } from "@/lib/login";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1)
}).strict();

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = loginSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Dados inválidos."
      },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const ipRateLimitKey = `login:ip:${ip}`;
  const emailRateLimitKey = `login:email:${parsed.data.email}`;
  const ipRateLimit = checkRateLimit({
    key: ipRateLimitKey,
    limit: 20,
    windowMs: 15 * 60 * 1000
  });
  const emailRateLimit = checkRateLimit({
    key: emailRateLimitKey,
    limit: 5,
    windowMs: 15 * 60 * 1000
  });

  if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "Muitas tentativas de login. Aguarde antes de tentar novamente."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(ipRateLimit.retryAfter, emailRateLimit.retryAfter)
          )
        }
      }
    );
  }

  const auth = await authenticateUser(parsed.data.email, parsed.data.senha);

  if (!auth) {
    return NextResponse.json(
      {
        error: "INVALID_CREDENTIALS",
        message: "Credenciais inválidas."
      },
      { status: 401 }
    );
  }

  clearRateLimit(ipRateLimitKey);
  clearRateLimit(emailRateLimitKey);
  await setSessionCookie(auth.token);

  return NextResponse.json({
    data: {
      id: auth.user.id,
      nome: auth.user.nome,
      email: auth.user.email
    }
  });
}
