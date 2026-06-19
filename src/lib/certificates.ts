import crypto from "crypto";
import type { CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  evaluateCertificationEligibility,
  refreshEnrollmentCertificationEligibility
} from "@/lib/evaluations";
import { hasPermission } from "@/lib/permissions";

export type CertificateSummary = {
  id: string;
  codigoValidacao: string;
  status: string;
  dataEmissao: string;
  dataCancelamento: string | null;
  motivoCancelamento: string | null;
  participante: string;
  curso: string;
  turma: string;
  cargaHoraria: string;
};

export type ConclusionApproval = {
  inscricaoId: string;
  participante: string;
  email: string;
  curso: string;
  turma: string;
  progresso: string;
  aulasConcluidas: number;
  totalAulas: number;
  concluidoEm: string | null;
  ultimoAcesso: string | null;
};

export type PublicCertificate = {
  codigoValidacao: string;
  status: string;
  participante: string;
  curso: string;
  cargaHoraria: string;
  dataEmissao: string;
  dataCancelamento: string | null;
  motivoCancelamento: string | null;
  emissor: string;
};

export class CertificateIssueError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "CertificateIssueError";
    this.code = code;
    this.status = status;
  }
}

export function generateCertificateCode() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `LABC-${year}-${suffix}`;
}

function maskPublicName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "Aluno";
  }

  return [
    parts[0],
    ...parts.slice(1).map((part) => `${part[0] ?? ""}.`)
  ].join(" ");
}

export async function issueCertificate(inscricaoId: string, issuedBy?: string) {
  const db = getDb();
  const eligibility = await refreshEnrollmentCertificationEligibility(inscricaoId);
  const enrollment = await db.query(
    `
      SELECT id, status, apto_certificado
      FROM inscricoes
      WHERE id = $1
      LIMIT 1
    `,
    [inscricaoId]
  );
  const item = enrollment.rows[0] as
    | { id: string; status: string; apto_certificado: boolean }
    | undefined;

  if (!item) {
    throw new CertificateIssueError(
      "ENROLLMENT_NOT_FOUND",
      "Inscrição não encontrada.",
      404
    );
  }

  if (item.status === "cancelado") {
    throw new CertificateIssueError(
      "ENROLLMENT_CANCELED",
      "Inscrição cancelada não pode receber certificado.",
      409
    );
  }

  if (!item.apto_certificado || !eligibility.eligible) {
    const detail = eligibility.pendencias.length
      ? ` Pendências: ${eligibility.pendencias.join(", ")}.`
      : "";
    throw new CertificateIssueError(
      "NOT_ELIGIBLE",
      `Aluno ainda não está apto à certificação.${detail}`,
      422
    );
  }

  const codigo = generateCertificateCode();
  const existingCertificate = await db.query(
    "SELECT id, status FROM certificados WHERE inscricao_id = $1 LIMIT 1",
    [inscricaoId]
  );
  const isReissue = Boolean(existingCertificate.rows[0]);
  const hash = crypto
    .createHash("sha256")
    .update(`${inscricaoId}:${codigo}`)
    .digest("hex");

  const result = await db.query(
    `
      INSERT INTO certificados (
        id, inscricao_id, codigo_validacao, status, hash_documento, emitido_por
      )
      VALUES (gen_random_uuid(), $1, $2, 'valido', $3, $4)
      ON CONFLICT (inscricao_id)
      DO UPDATE SET
        status = 'valido',
        codigo_validacao = EXCLUDED.codigo_validacao,
        hash_documento = EXCLUDED.hash_documento,
        emitido_por = EXCLUDED.emitido_por,
        data_emissao = now(),
        data_cancelamento = NULL,
        motivo_cancelamento = NULL
      RETURNING *
    `,
    [inscricaoId, codigo, hash, issuedBy ?? null]
  );

  return {
    certificate: result.rows[0],
    isReissue
  };
}

export async function listConclusionApprovals(
  user: CurrentUser
): Promise<ConclusionApproval[]> {
  const db = getDb();
  const canApprove = hasPermission(user, "certificates.issue");

  if (!canApprove) {
    return [];
  }

  const result = await db.query(
    `
      SELECT
        i.id AS inscricao_id,
        u.nome AS participante,
        u.email,
        c.nome AS curso,
        t.nome AS turma,
        pc.percentual_progresso,
        pc.aulas_concluidas,
        pc.total_aulas,
        to_char(pc.concluido_em, 'DD/MM/YYYY HH24:MI') AS concluido_em,
        to_char(pc.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso
      FROM progresso_cursos pc
      INNER JOIN inscricoes i ON i.id = pc.inscricao_id
      INNER JOIN usuarios u ON u.id = i.usuario_id
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN certificados cert
        ON cert.inscricao_id = i.id
       AND cert.status = 'valido'
      WHERE pc.status = 'completed'
        AND i.status <> 'cancelado'
        AND i.apto_certificado = true
        AND cert.id IS NULL
      ORDER BY pc.concluido_em DESC NULLS LAST, pc.ultimo_acesso_em DESC NULLS LAST
    `
  );

  return result.rows.map((item) => ({
    inscricaoId: item.inscricao_id,
    participante: item.participante,
    email: item.email,
    curso: item.curso,
    turma: item.turma,
    progresso: String(item.percentual_progresso),
    aulasConcluidas: Number(item.aulas_concluidas),
    totalAulas: Number(item.total_aulas),
    concluidoEm: item.concluido_em,
    ultimoAcesso: item.ultimo_acesso
  }));
}

export async function approveConclusionAndIssueCertificate(
  inscricaoId: string,
  approvedBy: string
) {
  const db = getDb();
  const eligibility = await evaluateCertificationEligibility(inscricaoId);
  if (!eligibility.eligible) {
    throw new CertificateIssueError(
      "CERTIFICATION_REQUIREMENTS_PENDING",
      `Ainda existem pendências para emissão: ${eligibility.pendencias.join(", ") || "requisitos não cumpridos"}.`,
      422
    );
  }
  const pending = await db.query(
    `
      SELECT i.id
      FROM inscricoes i
      INNER JOIN progresso_cursos pc ON pc.inscricao_id = i.id
      LEFT JOIN certificados cert
        ON cert.inscricao_id = i.id
       AND cert.status = 'valido'
      WHERE i.id = $1
        AND i.status <> 'cancelado'
        AND pc.status = 'completed'
        AND cert.id IS NULL
      LIMIT 1
    `,
    [inscricaoId]
  );

  if (!pending.rows[0]) {
    throw new CertificateIssueError(
      "CONCLUSION_NOT_PENDING",
      "Conclusão não encontrada ou já aprovada.",
      409
    );
  }

  await db.query(
    `
      UPDATE inscricoes
      SET apto_certificado = true,
          atualizado_em = now()
      WHERE id = $1
    `,
    [inscricaoId]
  );

  return issueCertificate(inscricaoId, approvedBy);
}

export async function listCertificates(user?: CurrentUser): Promise<CertificateSummary[]> {
  const db = getDb();
  const canSeeAll =
    !user ||
    hasPermission(user, "certificates.issue") ||
    hasPermission(user, "certificates.cancel") ||
    hasPermission(user, "reports.export");
  const result = await db.query(
    `
    SELECT
      cert.id,
      cert.codigo_validacao,
      cert.status,
      to_char(cert.data_emissao, 'DD/MM/YYYY') AS data_emissao,
      to_char(cert.data_cancelamento, 'DD/MM/YYYY') AS data_cancelamento,
      cert.motivo_cancelamento,
      u.nome AS participante,
      c.nome AS curso,
      t.nome AS turma,
      c.carga_horaria
    FROM certificados cert
    INNER JOIN inscricoes i ON i.id = cert.inscricao_id
    INNER JOIN usuarios u ON u.id = i.usuario_id
    INNER JOIN turmas t ON t.id = i.turma_id
    INNER JOIN cursos c ON c.id = t.curso_id
    WHERE (
      $1::uuid IS NULL
      OR i.usuario_id = $1
      OR EXISTS (
        SELECT 1 FROM vinculos_instrutoria vi
        WHERE vi.turma_id = t.id AND vi.usuario_id = $1
      )
    )
    ORDER BY cert.data_emissao DESC
  `,
    [canSeeAll ? null : user?.id]
  );

  return result.rows.map((item) => ({
    id: item.id,
    codigoValidacao: item.codigo_validacao,
    status: item.status,
    dataEmissao: item.data_emissao,
    dataCancelamento: item.data_cancelamento,
    motivoCancelamento: item.motivo_cancelamento,
    participante: item.participante,
    curso: item.curso,
    turma: item.turma,
    cargaHoraria: String(item.carga_horaria)
  }));
}

export async function getPublicCertificate(
  codigo: string
): Promise<PublicCertificate | null> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        cert.codigo_validacao,
        cert.status,
        to_char(cert.data_emissao, 'DD/MM/YYYY') AS data_emissao,
        to_char(cert.data_cancelamento, 'DD/MM/YYYY') AS data_cancelamento,
        cert.motivo_cancelamento,
        u.nome AS participante,
        c.nome AS curso,
        c.carga_horaria
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      INNER JOIN usuarios u ON u.id = i.usuario_id
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE cert.codigo_validacao = $1
      LIMIT 1
    `,
    [codigo]
  );

  const certificate = result.rows[0];

  if (!certificate) {
    return null;
  }

  return {
    codigoValidacao: certificate.codigo_validacao,
    status: certificate.status,
    participante: maskPublicName(certificate.participante),
    curso: certificate.curso,
    cargaHoraria: String(certificate.carga_horaria),
    dataEmissao: certificate.data_emissao,
    dataCancelamento: certificate.data_cancelamento,
    motivoCancelamento: certificate.motivo_cancelamento,
    emissor: "Escola LaBC de Inovação Pública"
  };
}

export async function cancelCertificate(certificateId: string, reason: string) {
  const db = getDb();
  const result = await db.query(
    `
      UPDATE certificados
      SET status = 'cancelado',
          data_cancelamento = now(),
          motivo_cancelamento = $2
      WHERE id = $1
      RETURNING id, codigo_validacao, status
    `,
    [certificateId, reason]
  );

  return result.rows[0] as
    | { id: string; codigo_validacao: string; status: string }
    | undefined;
}
