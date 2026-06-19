import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "UNAUTHENTICATED",
        message: "Usuário não autenticado."
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    data: user
  });
}
