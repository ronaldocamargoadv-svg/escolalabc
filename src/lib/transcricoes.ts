import { getDb } from "@/lib/db";
import {
  getTranscriptionService,
  type GlossaryTerm,
  type TranscriptionStatus
} from "@/lib/transcription-service";
import { type CurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const allowedAudioMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "video/mp4",
  "video/webm",
  "audio/webm"
]);

export const allowedAudioExtensions = [".mp3", ".wav", ".m4a", ".mp4", ".webm"];

export type MeetingSummary = {
  id: string;
  titulo: string;
  status: TranscriptionStatus;
  nomeArquivoOriginal: string;
  caminhoAudio: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type MeetingSegment = {
  id: string;
  order: number;
  speakerKey: string;
  speakerName: string | null;
  startSeconds: number;
  endSeconds: number;
  topic: string | null;
  rawText: string;
  reviewedText: string;
};

export type MeetingDetail = MeetingSummary & {
  mimeType: string;
  tamanhoBytes: number;
  textoBruto: string;
  textoRevisado: string;
  textoFinal: string;
  trechos: MeetingSegment[];
};

export type GlossaryEntry = {
  id: string;
  termo: string;
  categoria: string;
  formaPreferida: string;
  observacao: string | null;
};

function canViewAllTranscriptions(user?: CurrentUser) {
  return Boolean(
    user &&
      (hasPermission(user, "audit.view") || hasPermission(user, "reports.view"))
  );
}

function normalizeStatus(status: string): TranscriptionStatus {
  const statuses: TranscriptionStatus[] = [
    "pendente",
    "processando",
    "aguardando_revisao",
    "revisado",
    "aprovado",
    "exportado"
  ];

  return statuses.includes(status as TranscriptionStatus)
    ? (status as TranscriptionStatus)
    : "pendente";
}

function rowToSummary(row: Record<string, unknown>): MeetingSummary {
  const id = String(row.id);
  const storedPath = String(row.caminho_audio);
  const caminhoAudio = storedPath.startsWith(".uploads/")
    ? `/api/transcricoes/${id}/audio`
    : storedPath;

  return {
    id,
    titulo: String(row.titulo),
    status: normalizeStatus(String(row.status)),
    nomeArquivoOriginal: String(row.nome_arquivo_original),
    caminhoAudio,
    criadoEm: String(row.criado_em),
    atualizadoEm: String(row.atualizado_em)
  };
}

function rowToSegment(row: Record<string, unknown>): MeetingSegment {
  return {
    id: String(row.id),
    order: Number(row.ordem),
    speakerKey: String(row.falante_chave),
    speakerName: row.falante_nome ? String(row.falante_nome) : null,
    startSeconds: Number(row.inicio_segundos),
    endSeconds: Number(row.fim_segundos),
    topic: row.assunto ? String(row.assunto) : null,
    rawText: String(row.texto_bruto),
    reviewedText: String(row.texto_revisado ?? row.texto_bruto)
  };
}

export function isAllowedAudio(fileName: string, mimeType: string) {
  const lowerName = fileName.toLowerCase();
  return (
    allowedAudioMimeTypes.has(mimeType) ||
    allowedAudioExtensions.some((extension) => lowerName.endsWith(extension))
  );
}

export async function listMeetings(user?: CurrentUser) {
  const db = getDb();
  const canViewAll = canViewAllTranscriptions(user);
  const result = canViewAll
    ? await db.query(`
    SELECT
      id,
      titulo,
      status,
      nome_arquivo_original,
      caminho_audio,
      to_char(criado_em, 'DD/MM/YYYY HH24:MI') AS criado_em,
      to_char(atualizado_em, 'DD/MM/YYYY HH24:MI') AS atualizado_em
    FROM transcricao_reunioes
    ORDER BY atualizado_em DESC
    LIMIT 50
  `)
    : await db.query(
        `
          SELECT
            id,
            titulo,
            status,
            nome_arquivo_original,
            caminho_audio,
            to_char(criado_em, 'DD/MM/YYYY HH24:MI') AS criado_em,
            to_char(atualizado_em, 'DD/MM/YYYY HH24:MI') AS atualizado_em
          FROM transcricao_reunioes
          WHERE criado_por = $1::uuid
          ORDER BY atualizado_em DESC
          LIMIT 50
        `,
        [user?.id ?? "00000000-0000-0000-0000-000000000000"]
      );

  return result.rows.map(rowToSummary);
}

export async function getMeeting(
  id: string,
  user?: CurrentUser
): Promise<MeetingDetail | null> {
  const db = getDb();
  const canViewAll = canViewAllTranscriptions(user);
  const meetingResult = canViewAll || !user
    ? await db.query(
        `
      SELECT
        id,
        titulo,
        status,
        nome_arquivo_original,
        mime_type,
        caminho_audio,
        tamanho_bytes,
        COALESCE(texto_bruto, '') AS texto_bruto,
        COALESCE(texto_revisado, '') AS texto_revisado,
        COALESCE(texto_final, '') AS texto_final,
        to_char(criado_em, 'DD/MM/YYYY HH24:MI') AS criado_em,
        to_char(atualizado_em, 'DD/MM/YYYY HH24:MI') AS atualizado_em
      FROM transcricao_reunioes
      WHERE id = $1::uuid
      LIMIT 1
    `,
        [id]
      )
    : await db.query(
        `
          SELECT
            id,
            titulo,
            status,
            nome_arquivo_original,
            mime_type,
            caminho_audio,
            tamanho_bytes,
            COALESCE(texto_bruto, '') AS texto_bruto,
            COALESCE(texto_revisado, '') AS texto_revisado,
            COALESCE(texto_final, '') AS texto_final,
            to_char(criado_em, 'DD/MM/YYYY HH24:MI') AS criado_em,
            to_char(atualizado_em, 'DD/MM/YYYY HH24:MI') AS atualizado_em
          FROM transcricao_reunioes
          WHERE id = $1::uuid AND criado_por = $2::uuid
          LIMIT 1
        `,
        [id, user.id]
      );

  const meeting = meetingResult.rows[0];
  if (!meeting) return null;

  const segmentResult = await db.query(
    `
      SELECT
        id,
        ordem,
        falante_chave,
        falante_nome,
        inicio_segundos,
        fim_segundos,
        assunto,
        texto_bruto,
        texto_revisado
      FROM transcricao_trechos
      WHERE reuniao_id = $1::uuid
      ORDER BY ordem ASC
    `,
    [id]
  );

  return {
    ...rowToSummary(meeting),
    mimeType: String(meeting.mime_type),
    tamanhoBytes: Number(meeting.tamanho_bytes),
    textoBruto: String(meeting.texto_bruto),
    textoRevisado: String(meeting.texto_revisado),
    textoFinal: String(meeting.texto_final),
    trechos: segmentResult.rows.map(rowToSegment)
  };
}

export async function createMeeting(input: {
  title: string;
  fileName: string;
  mimeType: string;
  audioPath: string;
  size: number;
  userId: string;
}) {
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO transcricao_reunioes (
        titulo,
        status,
        nome_arquivo_original,
        mime_type,
        caminho_audio,
        tamanho_bytes,
        criado_por
      )
      VALUES ($1, 'pendente', $2, $3, $4, $5, $6::uuid)
      RETURNING id
    `,
    [
      input.title,
      input.fileName,
      input.mimeType,
      input.audioPath,
      input.size,
      input.userId
    ]
  );

  return String(result.rows[0].id);
}

export async function listGlossaryTerms(): Promise<GlossaryEntry[]> {
  const db = getDb();
  const result = await db.query(`
    SELECT id, termo, categoria, forma_preferida, observacao
    FROM transcricao_glossario
    ORDER BY termo ASC
  `);

  return result.rows.map((row) => ({
    id: String(row.id),
    termo: String(row.termo),
    categoria: String(row.categoria),
    formaPreferida: String(row.forma_preferida),
    observacao: row.observacao ? String(row.observacao) : null
  }));
}

export async function createGlossaryTerm(input: {
  termo: string;
  categoria: string;
  formaPreferida: string;
  observacao?: string;
  userId: string;
}) {
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO transcricao_glossario (
        termo, categoria, forma_preferida, observacao, criado_por
      )
      VALUES ($1, $2, $3, $4, $5::uuid)
      ON CONFLICT (termo)
      DO UPDATE SET
        categoria = EXCLUDED.categoria,
        forma_preferida = EXCLUDED.forma_preferida,
        observacao = EXCLUDED.observacao
      RETURNING id, termo, categoria, forma_preferida, observacao
    `,
    [
      input.termo,
      input.categoria,
      input.formaPreferida,
      input.observacao || null,
      input.userId
    ]
  );

  const row = result.rows[0];
  return {
    id: String(row.id),
    termo: String(row.termo),
    categoria: String(row.categoria),
    formaPreferida: String(row.forma_preferida),
    observacao: row.observacao ? String(row.observacao) : null
  };
}

export async function processMeeting(id: string) {
  const db = getDb();
  await db.query(
    "UPDATE transcricao_reunioes SET status = 'processando', atualizado_em = now() WHERE id = $1::uuid",
    [id]
  );

  const meeting = await getMeeting(id);
  if (!meeting) return null;

  const glossary = await listGlossaryTerms();
  const service = getTranscriptionService();
  const result = await service.transcribe({
    fileName: meeting.nomeArquivoOriginal,
    mimeType: meeting.mimeType,
    glossary: glossary.map(
      (item): GlossaryTerm => ({
        termo: item.termo,
        formaPreferida: item.formaPreferida
      })
    )
  });

  await db.query("DELETE FROM transcricao_trechos WHERE reuniao_id = $1::uuid", [
    id
  ]);

  for (const [index, segment] of result.segments.entries()) {
    await db.query(
      `
        INSERT INTO transcricao_trechos (
          reuniao_id,
          ordem,
          falante_chave,
          inicio_segundos,
          fim_segundos,
          assunto,
          texto_bruto,
          texto_revisado
        )
        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        index + 1,
        segment.speakerKey,
        segment.startSeconds,
        segment.endSeconds,
        segment.topic,
        segment.rawText,
        segment.reviewedText
      ]
    );
  }

  await db.query(
    `
      UPDATE transcricao_reunioes
      SET
        status = 'aguardando_revisao',
        texto_bruto = $2,
        texto_revisado = $3,
        texto_final = $4,
        atualizado_em = now()
      WHERE id = $1::uuid
    `,
    [id, result.rawText, result.reviewedText, result.finalText]
  );

  return getMeeting(id);
}

export async function updateSpeakerName(input: {
  meetingId: string;
  speakerKey: string;
  speakerName: string;
}) {
  const db = getDb();
  await db.query(
    `
      UPDATE transcricao_trechos
      SET falante_nome = $3
      WHERE reuniao_id = $1::uuid AND falante_chave = $2
    `,
    [input.meetingId, input.speakerKey, input.speakerName]
  );
  await rebuildReviewedTexts(input.meetingId, "revisado");
}

export async function updateSegmentText(input: {
  meetingId: string;
  segmentId: string;
  reviewedText: string;
}) {
  const db = getDb();
  await db.query(
    `
      UPDATE transcricao_trechos
      SET texto_revisado = $3
      WHERE reuniao_id = $1::uuid AND id = $2::uuid
    `,
    [input.meetingId, input.segmentId, input.reviewedText]
  );
  await rebuildReviewedTexts(input.meetingId, "revisado");
}

export async function applyGlossaryToMeeting(meetingId: string) {
  const meeting = await getMeeting(meetingId);
  if (!meeting) return null;
  const glossary = await listGlossaryTerms();
  const db = getDb();

  for (const segment of meeting.trechos) {
    let text = segment.reviewedText;
    for (const term of glossary) {
      const escaped = term.termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(`\\b${escaped}\\b`, "gi"), term.formaPreferida);
    }
    await db.query(
      `
        UPDATE transcricao_trechos
        SET texto_revisado = $3
        WHERE reuniao_id = $1::uuid AND id = $2::uuid
      `,
      [meetingId, segment.id, text]
    );
  }

  await rebuildReviewedTexts(meetingId, "revisado");
  return getMeeting(meetingId);
}

export async function approveMeeting(meetingId: string) {
  await rebuildReviewedTexts(meetingId, "aprovado");
}

export async function markExported(meetingId: string) {
  const db = getDb();
  await db.query(
    "UPDATE transcricao_reunioes SET status = 'exportado', atualizado_em = now() WHERE id = $1::uuid",
    [meetingId]
  );
}

async function rebuildReviewedTexts(
  meetingId: string,
  status: TranscriptionStatus
) {
  const meeting = await getMeeting(meetingId);
  if (!meeting) return;

  const reviewedText = meeting.trechos
    .map((segment) => `${segment.speakerName ?? speakerLabel(segment.speakerKey)}: ${segment.reviewedText}`)
    .join("\n");
  const finalText = buildFinalText(meeting.trechos);
  const db = getDb();

  await db.query(
    `
      UPDATE transcricao_reunioes
      SET
        status = $2,
        texto_revisado = $3,
        texto_final = $4,
        atualizado_em = now()
      WHERE id = $1::uuid
    `,
    [meetingId, status, reviewedText, finalText]
  );
}

export function speakerLabel(speakerKey: string) {
  const number = speakerKey.replace(/\D/g, "") || speakerKey;
  return `Falante ${number}`;
}

function buildFinalText(segments: MeetingSegment[]) {
  const lines: string[] = [];
  let lastTopic = "";
  let lastSpeaker = "";
  let paragraph = "";

  for (const segment of segments) {
    const topic = segment.topic || "Trechos revisados";
    const speaker = segment.speakerName ?? speakerLabel(segment.speakerKey);

    if (topic !== lastTopic) {
      if (paragraph) lines.push(paragraph);
      lines.push(`## ${topic}`);
      paragraph = "";
      lastTopic = topic;
      lastSpeaker = "";
    }

    if (speaker === lastSpeaker && paragraph) {
      paragraph += ` ${segment.reviewedText}`;
    } else {
      if (paragraph) lines.push(paragraph);
      paragraph = `**${speaker}:** ${segment.reviewedText}`;
      lastSpeaker = speaker;
    }
  }

  if (paragraph) lines.push(paragraph);

  return lines.join("\n\n");
}
