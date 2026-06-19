import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { createGlossaryTerm, listGlossaryTerms } from "@/lib/transcricoes";

const glossarySchema = z.object({
  termo: z.string().trim().min(1).max(160),
  categoria: z.enum(["pessoa", "empresa", "orgao", "sigla", "termo_tecnico"]),
  formaPreferida: z.string().trim().min(1).max(160),
  observacao: z.string().trim().max(500).optional()
});

export async function GET() {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const glossary = await listGlossaryTerms();
  return NextResponse.json({ data: glossary });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = glossarySchema.safeParse(body.data);
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

  const term = await createGlossaryTerm({
    ...parsed.data,
    userId: auth.user.id
  });

  await writeAuditLog({
    action: "transcricao.glossario_salvo",
    entity: "transcricao_glossario",
    entityId: term.id,
    summary: `Termo ${term.termo} salvo no glossário de transcrições.`
  });

  return NextResponse.json({ data: term }, { status: 201 });
}
