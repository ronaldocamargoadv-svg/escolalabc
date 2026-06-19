import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/api-auth";
import { enrollmentsToCsv, listEnrollments } from "@/lib/enrollments";

const querySchema = z.object({
  status: z.enum(["ativo", "cancelado", "todos"]).default("todos")
});

export async function GET(request: Request) {
  const auth = await requireApiPermission("reports.export");
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? "todos"
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

  const csv = enrollmentsToCsv(
    await listEnrollments({ status: parsed.data.status, user: auth.user })
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inscricoes-labc.csv"'
    }
  });
}
