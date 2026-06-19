import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import { getDashboardMetrics, getRecentActivity } from "@/lib/reports";

export async function GET() {
  const auth = await requireApiPermission("reports.view");
  if (auth.response) return auth.response;

  const [metrics, recentActivity] = await Promise.all([
    getDashboardMetrics(auth.user),
    getRecentActivity(auth.user)
  ]);

  return NextResponse.json({
    data: {
      metrics,
      recentActivity
    }
  });
}
