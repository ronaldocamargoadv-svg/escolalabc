import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { uiLabel } from "@/lib/ui-labels";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function centerText(
  page: import("pdf-lib").PDFPage,
  text: string,
  options: {
    y: number;
    size: number;
    font: import("pdf-lib").PDFFont;
    color: import("pdf-lib").RGB;
    minX?: number;
    maxX?: number;
  }
) {
  const minX = options.minX ?? 54;
  const maxX = options.maxX ?? 788;
  const width = options.font.widthOfTextAtSize(text, options.size);
  page.drawText(text, {
    x: minX + (maxX - minX - width) / 2,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color
  });
}

function fitFontSize(
  text: string,
  font: import("pdf-lib").PDFFont,
  maxWidth: number,
  preferredSize: number,
  minSize: number
) {
  let size = preferredSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 1;
  }

  return size;
}

function wrapText(
  text: string,
  font: import("pdf-lib").PDFFont,
  size: number,
  maxWidth: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawCenteredMultiline(
  page: import("pdf-lib").PDFPage,
  lines: string[],
  options: {
    startY: number;
    lineHeight: number;
    size: number;
    font: import("pdf-lib").PDFFont;
    color: import("pdf-lib").RGB;
    minX?: number;
    maxX?: number;
  }
) {
  lines.forEach((line, index) => {
    centerText(page, line, {
      y: options.startY - index * options.lineHeight,
      size: options.size,
      font: options.font,
      color: options.color,
      minX: options.minX,
      maxX: options.maxX
    });
  });
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Identificador inválido." },
      { status: 400 }
    );
  }

  const db = getDb();
  const result = await db.query(
    `
      SELECT
        cert.id,
        cert.codigo_validacao,
        cert.status,
        to_char(cert.data_emissao, 'DD/MM/YYYY') AS data_emissao,
        to_char(cert.data_cancelamento, 'DD/MM/YYYY') AS data_cancelamento,
        cert.motivo_cancelamento,
        i.usuario_id,
        u.nome AS participante,
        c.nome AS curso,
        c.carga_horaria,
        t.nome AS turma,
        t.modalidade,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        to_char(t.data_fim, 'DD/MM/YYYY') AS data_fim
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      INNER JOIN usuarios u ON u.id = i.usuario_id
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE cert.id = $1
      LIMIT 1
    `,
    [id]
  );
  const certificate = result.rows[0];

  if (!certificate) {
    return NextResponse.json(
      { error: "CERTIFICATE_NOT_FOUND", message: "Certificado não encontrado." },
      { status: 404 }
    );
  }

  const canDownload =
    certificate.usuario_id === auth.user.id ||
    hasPermission(auth.user, "certificates.issue") ||
    hasPermission(auth.user, "certificates.cancel");

  if (!canDownload) {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
        message: "Perfil sem permissão para baixar este certificado."
      },
      { status: 403 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const validationUrl = `${appUrl}/certificados/validar?codigo=${encodeURIComponent(
    certificate.codigo_validacao
  )}`;
  const qrDataUrl = await QRCode.toDataURL(validationUrl, {
    margin: 1,
    width: 160
  });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const pdfDoc = await PDFDocument.create();
  const templatePath = path.join(
    process.cwd(),
    "public",
    "certificados",
    "modelo-certificado-escola-labc.pdf"
  );
  const logoPath = path.join(
    process.cwd(),
    "public",
    "brand",
    "logo-escola-labc-inovacao-web.png"
  );
  const [templateBytes, logoBytes] = await Promise.all([
    readFile(templatePath),
    readFile(logoPath)
  ]);
  const [templatePage] = await pdfDoc.embedPdf(templateBytes, [0]);
  const { width, height } = templatePage;
  const page = pdfDoc.addPage([width, height]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await pdfDoc.embedPng(qrBytes);
  const brandLogo = await pdfDoc.embedPng(logoBytes);

  const navy = rgb(0, 0.23, 0.48);
  const cyan = rgb(0, 0.53, 0.79);
  const lime = rgb(0.78, 0.85, 0);
  const muted = rgb(0.25, 0.31, 0.43);
  const white = rgb(1, 1, 1);
  const softBlue = rgb(0.97, 0.99, 1);
  const borderBlue = rgb(0.84, 0.9, 0.98);
  const danger = rgb(0.72, 0.12, 0.12);
  const isCanceled = certificate.status === "cancelado";

  page.drawPage(templatePage, {
    x: 0,
    y: 0,
    width,
    height
  });

  page.drawRectangle({
    x: 0,
    y: height - 41,
    width,
    height: 41,
    color: navy
  });
  page.drawRectangle({
    x: 0,
    y: height - 41,
    width: 215,
    height: 4,
    color: cyan
  });
  page.drawRectangle({
    x: 215,
    y: height - 41,
    width: 116,
    height: 4,
    color: lime
  });
  page.drawText("ESCOLA LaBC DE INOVAÇÃO", {
    x: 28,
    y: height - 26,
    size: 11,
    font: bold,
    color: white
  });
  page.drawText("BALNEÁRIO CAMBORIÚ - SC", {
    x: width - 178,
    y: height - 26,
    size: 8,
    font: bold,
    color: white
  });
  page.drawRectangle({ x: 130, y: 350, width: 610, height: 194, color: white });
  page.drawImage(brandLogo, {
    x: 381,
    y: 452,
    width: 80,
    height: 80
  });
  centerText(page, "CERTIFICADO", {
    y: 421,
    size: 24,
    font: bold,
    color: navy
  });
  centerText(page, "A Escola LaBC de Inovação certifica que", {
    y: 401,
    size: 10,
    font: bold,
    color: muted
  });

  if (isCanceled) {
    page.drawRectangle({
      x: 625,
      y: 392,
      width: 142,
      height: 44,
      borderColor: danger,
      borderWidth: 2
    });
    page.drawText("CANCELADO", {
      x: 643,
      y: 409,
      size: 18,
      font: bold,
      color: danger
    });
  }

  page.drawRectangle({
    x: 160,
    y: 315,
    width: 520,
    height: 40,
    color: white
  });
  const participantSize = fitFontSize(certificate.participante, bold, 400, 20, 13);
  centerText(page, certificate.participante.toUpperCase(), {
    y: 329,
    size: participantSize,
    font: bold,
    color: navy,
    minX: 220,
    maxX: 622
  });

  page.drawRectangle({
    x: 160,
    y: 220,
    width: 525,
    height: 88,
    color: white
  });
  const period = certificate.data_fim
    ? `${certificate.data_inicio} a ${certificate.data_fim}`
    : certificate.data_inicio;
  const description = `participou do curso ${certificate.curso}, ofertado pela Escola LaBC de Inovação, com carga horária de ${certificate.carga_horaria} horas, realizado no período de ${period}, no âmbito das ações de formação, inovação pública e melhoria dos serviços municipais.`;
  const descriptionLines = wrapText(description, regular, 11.5, 500).slice(0, 5);
  drawCenteredMultiline(page, descriptionLines, {
    startY: 286,
    lineHeight: 15,
    size: 11.5,
    font: regular,
    color: muted,
    minX: 160,
    maxX: 685
  });

  page.drawRectangle({ x: 130, y: 145, width: 610, height: 100, color: white });

  [
    { x: 146, label: "MODALIDADE", value: uiLabel(String(certificate.modalidade)).toUpperCase() },
    { x: 340, label: "CARGA HORÁRIA", value: `${certificate.carga_horaria} horas` },
    { x: 535, label: "CÓDIGO", value: certificate.codigo_validacao }
  ].forEach((item) => {
    page.drawRectangle({
      x: item.x,
      y: 160,
      width: 183,
      height: 32,
      color: softBlue,
      borderColor: borderBlue,
      borderWidth: 1
    });
    page.drawText(item.label, {
      x: item.x + 10,
      y: 181,
      size: 5.8,
      font: bold,
      color: muted
    });
    page.drawText(item.value, {
      x: item.x + 10,
      y: 169,
      size: 9,
      font: bold,
      color: navy
    });
  });

  page.drawRectangle({ x: 320, y: 121, width: 205, height: 17, color: white });
  centerText(page, `Balneário Camboriú/SC, ${certificate.data_emissao}.`, {
    y: 124,
    size: 12,
    font: regular,
    color: muted,
    minX: 260,
    maxX: 585
  });

  if (isCanceled) {
    page.drawText(`Status: cancelado em ${certificate.data_cancelamento ?? "-"}`, {
      x: 235,
      y: 105,
      size: 13,
      font: bold,
      color: danger
    });
    page.drawText(`Motivo: ${certificate.motivo_cancelamento ?? "Não informado"}`, {
      x: 235,
      y: 90,
      size: 11,
      font: regular,
      color: danger
    });
  }

  page.drawRectangle({ x: 52, y: 22, width: 724, height: 38, color: navy });
  page.drawText("Certificado emitido pela Escola LaBC de Inovação", {
    x: 62,
    y: 46,
    size: 7.5,
    font: bold,
    color: white
  });
  page.drawText(`Código: ${certificate.codigo_validacao}`, {
    x: 62,
    y: 36,
    size: 6.5,
    font: regular,
    color: white
  });
  page.drawText(`Verificação: ${validationUrl}`, {
    x: 62,
    y: 27,
    size: 6.5,
    font: regular,
    color: white
  });
  page.drawRectangle({ x: 760, y: 0, width: 81, height: 62, color: white });
  page.drawImage(qrImage, {
    x: 780,
    y: 9,
    width: 48,
    height: 48
  });

  const bytes = await pdfDoc.save();
  const fileName = `certificado-${safeFileName(certificate.participante)}${
    isCanceled ? "-cancelado" : ""
  }.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`
    }
  });
}
