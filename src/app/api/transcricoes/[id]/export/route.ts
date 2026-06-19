import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import { buildDocx } from "@/lib/docx";
import { writeAuditLog } from "@/lib/audit";
import { getMeeting, markExported } from "@/lib/transcricoes";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  request: Request,
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

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "docx";
  const filename = slugify(meeting.titulo) || "transcricao";
  const text = meeting.textoFinal || meeting.textoRevisado || meeting.textoBruto;
  let body: BodyInit;
  let contentType = "text/plain; charset=utf-8";
  let extension = "txt";

  if (format === "md") {
    body = text;
    contentType = "text/markdown; charset=utf-8";
    extension = "md";
  } else if (format === "txt") {
    body = text.replace(/\*\*/g, "").replace(/^##\s+/gm, "");
  } else {
    body = buildDocx(meeting.titulo, text);
    contentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    extension = "docx";
  }

  await markExported(id);
  await writeAuditLog({
    action: `transcricao.exportado_${extension}`,
    entity: "transcricao_reunioes",
    entityId: id,
    summary: `Transcrição ${meeting.titulo} exportada em ${extension}.`
  });

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}.${extension}"`
    }
  });
}
