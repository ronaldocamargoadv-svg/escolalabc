import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/api";
import { getPublicCertificate } from "@/lib/certificates";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = {
  params: Promise<{
    codigo: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const { codigo } = await params;
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `certificate-validation:${ip}`,
    limit: 30,
    windowMs: 60 * 1000
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        status: "limite_excedido",
        message: "Muitas validações em sequência. Aguarde antes de tentar novamente."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter)
        }
      }
    );
  }

  if (!/^LABC-\d{4}-[A-F0-9]{8}$/.test(codigo)) {
    return NextResponse.json(
      {
        status: "invalido",
        message: "Código de validação inválido."
      },
      { status: 400 }
    );
  }

  const certificate = await getPublicCertificate(codigo);

  if (!certificate) {
    return NextResponse.json(
      {
        status: "nao_encontrado",
        message: "Certificado não encontrado."
      },
      { status: 404 }
    );
  }

  return NextResponse.json(certificate);
}
