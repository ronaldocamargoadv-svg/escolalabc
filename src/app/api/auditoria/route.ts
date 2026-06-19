import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/api-auth";
import { listAuditLogs } from "@/lib/audit-logs";

const querySchema = z.object({
  acao: z.string().min(1).optional(),
  entidade: z.string().min(1).optional(),
  usuarioId: z.string().uuid().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100)
});

export async function GET(request: Request) {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    acao: url.searchParams.get("acao") || undefined,
    entidade: url.searchParams.get("entidade") || undefined,
    usuarioId: url.searchParams.get("usuarioId") || undefined,
    dataInicio: url.searchParams.get("dataInicio") || undefined,
    dataFim: url.searchParams.get("dataFim") || undefined,
    limit: url.searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Parâmetros inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const { limit, ...filters } = parsed.data;

  return NextResponse.json({
    data: await listAuditLogs({ limit, filters })
  });
}
