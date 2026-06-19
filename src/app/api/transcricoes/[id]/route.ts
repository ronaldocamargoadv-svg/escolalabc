import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import {
  applyGlossaryToMeeting,
  approveMeeting,
  getMeeting,
  processMeeting,
  updateSegmentText,
  updateSpeakerName
} from "@/lib/transcricoes";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("speaker"),
    speakerKey: z.string().min(1),
    speakerName: z.string().trim().min(1).max(120)
  }),
  z.object({
    action: z.literal("segment"),
    segmentId: z.string().uuid(),
    reviewedText: z.string().trim().min(1).max(5000)
  }),
  z.object({
    action: z.literal("apply_glossary")
  }),
  z.object({
    action: z.literal("approve")
  }),
  z.object({
    action: z.literal("process")
  })
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const { id } = await params;
  const meeting = await getMeeting(id, auth.user);

  if (!meeting) {
    return NextResponse.json(
      { error: "MEETING_NOT_FOUND", message: "Reunião não encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: meeting });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = patchSchema.safeParse(body.data);
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

  const { id } = await params;
  const meeting = await getMeeting(id, auth.user);
  if (!meeting) {
    return NextResponse.json(
      { error: "MEETING_NOT_FOUND", message: "Reunião não encontrada." },
      { status: 404 }
    );
  }

  if (parsed.data.action === "speaker") {
    await updateSpeakerName({
      meetingId: id,
      speakerKey: parsed.data.speakerKey,
      speakerName: parsed.data.speakerName
    });
  }

  if (parsed.data.action === "segment") {
    await updateSegmentText({
      meetingId: id,
      segmentId: parsed.data.segmentId,
      reviewedText: parsed.data.reviewedText
    });
  }

  if (parsed.data.action === "apply_glossary") {
    await applyGlossaryToMeeting(id);
  }

  if (parsed.data.action === "approve") {
    await approveMeeting(id);
  }

  if (parsed.data.action === "process") {
    await processMeeting(id);
  }

  await writeAuditLog({
    action: `transcricao.${parsed.data.action}`,
    entity: "transcricao_reunioes",
    entityId: id,
    summary: `Ação ${parsed.data.action} executada na transcrição ${meeting.titulo}.`
  });

  return NextResponse.json({ data: await getMeeting(id, auth.user) });
}
