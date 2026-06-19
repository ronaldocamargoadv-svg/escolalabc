import type { PoolClient } from "pg";
import type { CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export type EnrollmentSummary = {
  id: string;
  turmaId: string;
  participante: string;
  email: string;
  turma: string;
  curso: string;
  status: string;
  percentualFrequencia: string;
  aptoCertificado: boolean;
};

export type EnrollmentStatusFilter = "ativo" | "cancelado" | "todos";

export type CreateEnrollmentInput = {
  usuarioId: string;
  turmaId: string;
  origem?: string;
};

export type EnrollmentLifecycleStatus = "inscrito" | "cancelado";

export class EnrollmentError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "EnrollmentError";
    this.code = code;
    this.status = status;
  }
}

export async function listEnrollments({
  status = "todos",
  user
}: {
  status?: EnrollmentStatusFilter;
  user?: CurrentUser;
} = {}): Promise<EnrollmentSummary[]> {
  const db = getDb();
  const canSeeAll =
    !user ||
    hasPermission(user, "enrollments.manage") ||
    hasPermission(user, "reports.export");
  const result = await db.query(
    `
    SELECT
      i.id,
      t.id AS turma_id,
      u.nome AS participante,
      u.email,
      t.nome AS turma,
      c.nome AS curso,
      i.status,
      i.percentual_frequencia,
      i.apto_certificado
    FROM inscricoes i
    INNER JOIN usuarios u ON u.id = i.usuario_id
    INNER JOIN turmas t ON t.id = i.turma_id
    INNER JOIN cursos c ON c.id = t.curso_id
    WHERE (
      $1 = 'todos'
      OR ($1 = 'ativo' AND i.status <> 'cancelado')
      OR ($1 = 'cancelado' AND i.status = 'cancelado')
    )
    AND (
      $2::uuid IS NULL
      OR i.usuario_id = $2
      OR EXISTS (
        SELECT 1 FROM vinculos_instrutoria vi
        WHERE vi.turma_id = t.id AND vi.usuario_id = $2 AND vi.status = 'ativo'
      )
    )
    ORDER BY i.data_inscricao DESC
  `,
    [status, canSeeAll ? null : user?.id]
  );

  return result.rows.map((item) => ({
    id: item.id,
    turmaId: item.turma_id,
    participante: item.participante,
    email: item.email,
    turma: item.turma,
    curso: item.curso,
    status: item.status,
    percentualFrequencia: String(item.percentual_frequencia),
    aptoCertificado: Boolean(item.apto_certificado)
  }));
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function enrollmentsToCsv(enrollments: EnrollmentSummary[]) {
  const header = [
    "participante",
    "email",
    "curso",
    "turma",
    "status",
    "percentual_frequencia",
    "apto_certificado"
  ];
  const lines = enrollments.map((item) =>
    [
      item.participante,
      item.email,
      item.curso,
      item.turma,
      item.status,
      item.percentualFrequencia,
      item.aptoCertificado
    ]
      .map(csvCell)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

export async function createManagedEnrollment(input: CreateEnrollmentInput) {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const enrollment = await createEnrollmentWithinTransaction(client, input);

    await client.query("COMMIT");

    return enrollment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createEnrollmentWithinTransaction(
  client: PoolClient,
  input: CreateEnrollmentInput
) {
  const userResult = await client.query(
    "SELECT id, status FROM usuarios WHERE id = $1",
    [input.usuarioId]
  );
  const user = userResult.rows[0] as
    | { id: string; status: string }
    | undefined;

  if (!user) {
    throw new EnrollmentError(
      "USER_NOT_FOUND",
      "Usuário não encontrado.",
      404
    );
  }

  if (user.status !== "ativo") {
    throw new EnrollmentError(
      "USER_INACTIVE",
      "Usuário inativo não pode ser inscrito.",
      409
    );
  }

  const classResult = await client.query(
    `
      SELECT
        t.id,
        t.vagas,
        t.status AS turma_status,
        c.status AS curso_status
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE t.id = $1
      FOR UPDATE OF t
      LIMIT 1
    `,
    [input.turmaId]
  );
  const turma = classResult.rows[0];

  if (!turma) {
    throw new EnrollmentError(
      "CLASS_NOT_FOUND",
      "Turma não encontrada.",
      404
    );
  }

  if (turma.turma_status !== "publicada") {
    throw new EnrollmentError(
      "CLASS_UNAVAILABLE",
      "Turma não publicada não aceita inscrições.",
      409
    );
  }

  if (turma.curso_status !== "publicado") {
    throw new EnrollmentError(
      "COURSE_UNAVAILABLE",
      "Curso não publicado não aceita inscrições.",
      409
    );
  }

  const existingEnrollment = await client.query(
    `
      SELECT id, status
      FROM inscricoes
      WHERE usuario_id = $1
        AND turma_id = $2
      LIMIT 1
    `,
    [input.usuarioId, input.turmaId]
  );
  const existing = existingEnrollment.rows[0] as
    | { id: string; status: string }
    | undefined;

  if (existing && existing.status !== "cancelado") {
    return existing;
  }

  const capacity = await client.query(
    `
      SELECT COUNT(id)::int AS inscritos
      FROM inscricoes
      WHERE turma_id = $1
        AND status <> 'cancelado'
    `,
    [input.turmaId]
  );

  if (Number(capacity.rows[0].inscritos) >= Number(turma.vagas)) {
    throw new EnrollmentError(
      "CLASS_FULL",
      "Turma sem vagas disponíveis.",
      409
    );
  }

  const result = await client.query(
    `
      INSERT INTO inscricoes (
        id, usuario_id, turma_id, status, origem, percentual_frequencia,
        apto_certificado, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, 'inscrito', $3, 0, false, now())
      ON CONFLICT (usuario_id, turma_id)
      DO UPDATE SET
        status = 'inscrito',
        origem = COALESCE(inscricoes.origem, $3),
        atualizado_em = now()
      RETURNING *
    `,
    [input.usuarioId, input.turmaId, input.origem || "gestao"]
  );

  return result.rows[0];
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentLifecycleStatus
) {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT
          i.id,
          i.usuario_id,
          i.turma_id,
          i.status,
          u.status AS usuario_status,
          t.nome AS turma,
          t.status AS turma_status,
          t.vagas,
          c.status AS curso_status,
          EXISTS (
            SELECT 1
            FROM certificados cert
            WHERE cert.inscricao_id = i.id
              AND cert.status = 'valido'
          ) AS has_valid_certificate,
          (
            SELECT COUNT(active_i.id)::int
            FROM inscricoes active_i
            WHERE active_i.turma_id = i.turma_id
              AND active_i.status <> 'cancelado'
              AND active_i.id <> i.id
          ) AS outros_inscritos
        FROM inscricoes i
        INNER JOIN usuarios u ON u.id = i.usuario_id
        INNER JOIN turmas t ON t.id = i.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        WHERE i.id = $1
        FOR UPDATE OF i, t
        LIMIT 1
      `,
      [enrollmentId]
    );
    const enrollment = existing.rows[0];

    if (!enrollment) {
      throw new EnrollmentError(
        "ENROLLMENT_NOT_FOUND",
        "Inscrição não encontrada.",
        404
      );
    }

    if (status === "cancelado" && enrollment.has_valid_certificate) {
      throw new EnrollmentError(
        "ENROLLMENT_HAS_VALID_CERTIFICATE",
        "Inscrição com certificado válido não pode ser cancelada.",
        409
      );
    }

    if (status === "inscrito") {
      if (enrollment.usuario_status !== "ativo") {
        throw new EnrollmentError(
          "USER_INACTIVE",
          "Usuário inativo não pode ser reinscrito.",
          409
        );
      }

      if (enrollment.turma_status !== "publicada") {
        throw new EnrollmentError(
          "CLASS_UNAVAILABLE",
          "Turma não publicada não aceita reinscrições.",
          409
        );
      }

      if (enrollment.curso_status !== "publicado") {
        throw new EnrollmentError(
          "COURSE_UNAVAILABLE",
          "Curso não publicado não aceita reinscrições.",
          409
        );
      }

      if (Number(enrollment.outros_inscritos) >= Number(enrollment.vagas)) {
        throw new EnrollmentError(
          "CLASS_FULL",
          "Turma sem vagas disponíveis.",
          409
        );
      }
    }

    const result = await client.query(
      `
        UPDATE inscricoes
        SET status = $2,
            atualizado_em = now()
        WHERE id = $1
        RETURNING id, status
      `,
      [enrollmentId, status]
    );
    const updated = result.rows[0];

    await client.query("COMMIT");

    return {
      id: updated.id as string,
      turma: enrollment.turma as string,
      status: updated.status as EnrollmentLifecycleStatus
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
