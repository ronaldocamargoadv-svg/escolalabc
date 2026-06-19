import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/api-auth";
import {
  AttendanceReportAccessError,
  attendanceReportToCsv,
  getAttendanceReportRows
} from "@/lib/attendance";

const querySchema = z.object({
  turmaId: z.string().uuid().optional()
});

export async function GET(request: Request) {
  const auth = await requireApiPermission("reports.export");
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    turmaId: url.searchParams.get("turmaId") || undefined
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

  let rows;
  try {
    rows = await getAttendanceReportRows(auth.user, parsed.data.turmaId);
  } catch (error) {
    if (error instanceof AttendanceReportAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  const csv = attendanceReportToCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="relatorio-presencas-labc.csv"'
    }
  });
}
