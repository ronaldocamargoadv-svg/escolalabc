import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import {
  executiveReportToCsv,
  getExecutiveReportRows
} from "@/lib/reports";

export async function GET() {
  const auth = await requireApiPermission("reports.export");
  if (auth.response) return auth.response;

  const csv = executiveReportToCsv(await getExecutiveReportRows());

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="relatorio-executivo-labc.csv"'
    }
  });
}
