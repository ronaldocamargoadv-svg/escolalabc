import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiAnyPermission, requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";
import {
  createMeeting,
  listMeetings,
  MeetingCreationError,
  MeetingStatusError,
  updateMeetingStatus
} from "@/lib/meetings";

const createMeetingSchema = z.object({
  turmaId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/),
  modalidade: z.enum(["presencial", "online", "hibrido"]),
  local: z.string().optional(),
  linkOnline: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE)
    .optional()
});

const updateMeetingStatusSchema = z.object({
  encontroId: z.string().uuid(),
  status: z.enum(["previsto", "realizado", "cancelado"])
});

export async function GET() {
  const auth = await requireApiAnyPermission(["classes.create", "classes.edit"]);
  if (auth.response) return auth.response;

  return NextResponse.json({ data: await listMeetings(auth.user) });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("classes.create");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = createMeetingSchema.safeParse(body.data);

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

  let meeting;
  try {
    meeting = await createMeeting(parsed.data, auth.user);
  } catch (error) {
    if (error instanceof MeetingCreationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  await writeAuditLog({
    action: "encontro.criado",
    entity: "encontros",
    entityId: meeting.id,
    summary: `Encontro ${meeting.data} criado via API.`
  });

  return NextResponse.json({ data: meeting }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireApiPermission("classes.edit");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = updateMeetingStatusSchema.safeParse(body.data);

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

  let meeting;
  try {
    meeting = await updateMeetingStatus(
      parsed.data.encontroId,
      parsed.data.status,
      auth.user
    );
  } catch (error) {
    if (error instanceof MeetingStatusError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  await writeAuditLog({
    action: `encontro.${meeting.status}`,
    entity: "encontros",
    entityId: meeting.id,
    summary: `Encontro alterado para ${meeting.status} via API.`
  });

  return NextResponse.json({ data: meeting });
}
