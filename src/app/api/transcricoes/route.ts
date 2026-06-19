import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/api";
import {
  createMeeting,
  isAllowedAudio,
  listMeetings,
  processMeeting
} from "@/lib/transcricoes";

const maxAudioBytes = 25 * 1024 * 1024;
const maxOriginalFileNameLength = 180;

export async function GET() {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const meetings = await listMeetings(auth.user);
  return NextResponse.json({ data: meetings });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const maxMultipartOverheadBytes = 1024 * 1024;
  if (contentLength > maxAudioBytes + maxMultipartOverheadBytes) {
    return NextResponse.json(
      {
        error: "UPLOAD_TOO_LARGE",
        message: "A requisição de upload excede o limite permitido."
      },
      { status: 413 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "INVALID_FORM", message: "Envie o áudio em multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("audio");
  const title = String(formData.get("title") || "Reunião sem título")
    .trim()
    .slice(0, 160);

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "AUDIO_REQUIRED", message: "Arquivo de áudio obrigatório." },
      { status: 400 }
    );
  }

  if (file.size > maxAudioBytes) {
    return NextResponse.json(
      {
        error: "AUDIO_TOO_LARGE",
        message: "O arquivo deve ter no máximo 25 MB."
      },
      { status: 413 }
    );
  }

  if (!isAllowedAudio(file.name, file.type)) {
    return NextResponse.json(
      {
        error: "UNSUPPORTED_AUDIO",
        message: "Use arquivos .mp3, .wav, .m4a, .mp4 ou .webm."
      },
      { status: 415 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageDir = path.join(process.cwd(), ".uploads", "transcricoes");
  await mkdir(storageDir, { recursive: true });

  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-maxOriginalFileNameLength);
  const storedName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const fullPath = path.join(storageDir, storedName);
  const privatePath = `.uploads/transcricoes/${storedName}`;
  await writeFile(fullPath, bytes);

  const meetingId = await createMeeting({
    title: title || file.name,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    audioPath: privatePath,
    size: bytes.length,
    userId: auth.user.id
  });

  const processed = await processMeeting(meetingId);

  await writeAuditLog({
    action: "transcricao.upload_processado",
    entity: "transcricao_reunioes",
    entityId: meetingId,
    summary: `Áudio ${file.name} enviado e processado por transcrição demonstrativa.`,
    ip: getClientIp(request)
  });

  return NextResponse.json({ data: processed }, { status: 201 });
}
