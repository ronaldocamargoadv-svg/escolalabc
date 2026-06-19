import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import {
  AttendanceRegistrationError,
  listAttendances,
  registerAttendance
} from "@/lib/attendance";

const registerAttendanceSchema = z.object({
  inscricaoId: z.string().uuid(),
  encontroId: z.string().uuid(),
  status: z.enum(["presente", "ausente", "justificado"])
});

export async function GET() {
  const auth = await requireApiPermission("attendance.view");
  if (auth.response) return auth.response;

  return NextResponse.json({ data: await listAttendances(auth.user) });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("attendance.manage");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = registerAttendanceSchema.safeParse(body.data);

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

  let attendance;
  try {
    attendance = await registerAttendance(parsed.data, auth.user);
  } catch (error) {
    if (error instanceof AttendanceRegistrationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  await writeAuditLog({
    action: "presenca.registrada",
    entity: "presencas",
    entityId: attendance.id,
    summary: `Presença registrada como ${attendance.status} via API.`
  });

  return NextResponse.json({ data: attendance }, { status: 201 });
}
