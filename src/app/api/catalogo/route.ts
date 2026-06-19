import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import { listCatalogClasses } from "@/lib/catalog";

export async function GET() {
  const auth = await requireApiPermission("courses.view");
  if (auth.response) return auth.response;

  return NextResponse.json({
    data: await listCatalogClasses(auth.user.id)
  });
}
