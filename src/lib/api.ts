import { NextResponse } from "next/server";

const maxJsonBodyBytes = 256 * 1024;

export async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "UNSUPPORTED_MEDIA_TYPE",
          message: "Envie os dados em JSON."
        },
        { status: 415 }
      )
    };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > maxJsonBodyBytes) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "PAYLOAD_TOO_LARGE",
          message: "Requisição muito grande."
        },
        { status: 413 }
      )
    };
  }

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > maxJsonBodyBytes) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error: "PAYLOAD_TOO_LARGE",
            message: "Requisição muito grande."
          },
          { status: 413 }
        )
      };
    }

    return {
      ok: true as const,
      data: JSON.parse(rawBody)
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "JSON inválido."
        },
        { status: 400 }
      )
    };
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  return forwardedFor.split(",")[0]?.trim() || "local";
}
