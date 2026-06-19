import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeDownloadFileName(value: unknown) {
  return (
    String(value || "audio-labc")
      .replace(/[\r\n"\\]/g, "")
      .replace(/[^a-zA-Z0-9._ -]/g, "-")
      .trim()
      .slice(0, 180) || "audio-labc"
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiPermission("audit.view");
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "Identificador inválido." },
      { status: 400 }
    );
  }

  const db = getDb();
  const canViewAll =
    hasPermission(auth.user, "audit.view") || hasPermission(auth.user, "reports.view");
  const result = canViewAll
    ? await db.query(
        `
          SELECT caminho_audio, mime_type, nome_arquivo_original
          FROM transcricao_reunioes
          WHERE id = $1::uuid
          LIMIT 1
        `,
        [id]
      )
    : await db.query(
        `
          SELECT caminho_audio, mime_type, nome_arquivo_original
          FROM transcricao_reunioes
          WHERE id = $1::uuid AND criado_por = $2::uuid
          LIMIT 1
        `,
        [id, auth.user.id]
      );

  const meeting = result.rows[0];
  if (!meeting) {
    return NextResponse.json(
      { error: "AUDIO_NOT_FOUND", message: "Áudio não encontrado." },
      { status: 404 }
    );
  }

  const storedPath = String(meeting.caminho_audio);
  if (!storedPath.startsWith(".uploads/transcricoes/")) {
    return NextResponse.json(
      {
        error: "LEGACY_AUDIO_PATH",
        message: "Este áudio usa armazenamento legado e não pode ser servido pela API privada."
      },
      { status: 404 }
    );
  }

  const storageRoot = path.join(process.cwd(), ".uploads", "transcricoes");
  const fullPath = path.resolve(process.cwd(), storedPath);
  if (!fullPath.startsWith(`${storageRoot}${path.sep}`)) {
    return NextResponse.json(
      { error: "INVALID_AUDIO_PATH", message: "Caminho de áudio inválido." },
      { status: 400 }
    );
  }

  const bytes = await readFile(fullPath).catch(() => null);
  if (!bytes) {
    return NextResponse.json(
      { error: "AUDIO_NOT_FOUND", message: "Arquivo de áudio não encontrado." },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": String(meeting.mime_type || "application/octet-stream"),
      "content-disposition": `inline; filename="${safeDownloadFileName(
        meeting.nome_arquivo_original
      )}"`,
      "cache-control": "private, no-store"
    }
  });
}
