import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/api-auth";
import { auditLogsToCsv, listAuditLogs } from "@/lib/audit-logs";

const querySchema = z.object({
  acao: z.string().min(1).optional(),
  entidade: z.string().min(1).optional(),
  usuarioId: z.string().uuid().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
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
    dataFim: url.searchParams.get("dataFim") || undefined
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

  const csv = auditLogsToCsv(
    await listAuditLogs({ limit: null, filters: parsed.data })
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="auditoria-labc.csv"'
    }
  });
}
