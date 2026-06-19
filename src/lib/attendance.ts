import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { maybeAutoIssueCertificate } from "@/lib/certification-automation";
import { getDb } from "@/lib/db";
import { refreshEnrollmentCertificationEligibility } from "@/lib/evaluations";
import { hasPermission } from "@/lib/permissions";
import {
  assertActiveInstructorAssignment,
  InstructorAssignmentError
} from "@/lib/instructor-assignments";

export type AttendanceSummary = {
  id: string;
  participante: string;
  turma: string;
  curso: string;
  data: string;
  status: string;
  metodo: string;
};

export type AttendanceReportRow = {
  curso: string;
  turma: string;
  encontroData: string;
  horario: string;
  participante: string;
  email: string;
  inscricaoStatus: string;
  presencaStatus: string;
  metodo: string;
  percentualFrequencia: string;
  aptoCertificado: boolean;
};

export type RegisterAttendanceInput = {
  inscricaoId: string;
  encontroId: string;
  status: "presente" | "ausente" | "justificado";
};

export class AttendanceRegistrationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AttendanceRegistrationError";
    this.code = code;
    this.status = status;
  }
}

export class AttendanceReportAccessError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AttendanceReportAccessError";
    this.code = code;
    this.status = status;
  }
}

function canManageAllAttendances(user: CurrentUser) {
  return (
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "enrollments.manage")
  );
}

async function assertAttendanceAssignment(user: CurrentUser, turmaId: string) {
  try {
    await assertActiveInstructorAssignment(user, turmaId);
  } catch (error) {
    if (error instanceof InstructorAssignmentError) {
      throw new AttendanceRegistrationError(error.code, error.message, error.status);
    }
    throw error;
  }
}

export async function listAttendances(
  user: CurrentUser
): Promise<AttendanceSummary[]> {
  const db = getDb();
  let result;
  if (canManageAllAttendances(user)) {
    result = await db.query(`
        SELECT
          p.id,
          u.nome AS participante,
          t.nome AS turma,
          c.nome AS curso,
          to_char(e.data, 'DD/MM/YYYY') AS data,
          p.status,
          p.metodo
        FROM presencas p
        INNER JOIN inscricoes i ON i.id = p.inscricao_id
        INNER JOIN usuarios u ON u.id = i.usuario_id
        INNER JOIN encontros e ON e.id = p.encontro_id
        INNER JOIN turmas t ON t.id = i.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        ORDER BY p.registrado_em DESC
      `);
  } else if (hasPermission(user, "attendance.manage")) {
    result = await db.query(
        `
          SELECT
            p.id,
            u.nome AS participante,
            t.nome AS turma,
            c.nome AS curso,
            to_char(e.data, 'DD/MM/YYYY') AS data,
            p.status,
            p.metodo
          FROM presencas p
          INNER JOIN inscricoes i ON i.id = p.inscricao_id
          INNER JOIN usuarios u ON u.id = i.usuario_id
          INNER JOIN encontros e ON e.id = p.encontro_id
          INNER JOIN turmas t ON t.id = i.turma_id
          INNER JOIN cursos c ON c.id = t.curso_id
          WHERE EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
          )
          ORDER BY p.registrado_em DESC
        `,
        [user.id]
      );
  } else {
    result = await db.query(
      `
        SELECT
          p.id,
          u.nome AS participante,
          t.nome AS turma,
          c.nome AS curso,
          to_char(e.data, 'DD/MM/YYYY') AS data,
          p.status,
          p.metodo
        FROM presencas p
        INNER JOIN inscricoes i ON i.id = p.inscricao_id
        INNER JOIN usuarios u ON u.id = i.usuario_id
        INNER JOIN encontros e ON e.id = p.encontro_id
        INNER JOIN turmas t ON t.id = i.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        WHERE i.usuario_id = $1
        ORDER BY p.registrado_em DESC
      `,
      [user.id]
    );
  }

  return result.rows.map((item) => ({
    id: item.id,
    participante: item.participante,
    turma: item.turma,
    curso: item.curso,
    data: item.data,
    status: item.status,
    metodo: item.metodo
  }));
}

export async function recalculateEnrollmentFrequency(inscricaoId: string) {
  const db = getDb();
  await db.query(
    `
      WITH base AS (
        SELECT
          i.id AS inscricao_id,
          t.criterio_frequencia_minima,
          COUNT(e.id)::numeric AS total_encontros,
          COUNT(p.id) FILTER (WHERE p.status = 'presente')::numeric AS presencas
        FROM inscricoes i
        INNER JOIN turmas t ON t.id = i.turma_id
        LEFT JOIN encontros e ON e.turma_id = t.id AND e.status <> 'cancelado'
        LEFT JOIN presencas p ON p.encontro_id = e.id AND p.inscricao_id = i.id
        WHERE i.id = $1
        GROUP BY i.id, t.criterio_frequencia_minima
      )
      UPDATE inscricoes i
      SET
        percentual_frequencia = CASE
          WHEN base.total_encontros = 0 THEN 0
          ELSE ROUND((base.presencas / base.total_encontros) * 100, 2)
        END,
        atualizado_em = now()
      FROM base
      WHERE i.id = base.inscricao_id
    `,
    [inscricaoId]
  );
  await refreshEnrollmentCertificationEligibility(inscricaoId);
  await maybeAutoIssueCertificate(inscricaoId);
}

export async function registerAttendance(
  input: RegisterAttendanceInput,
  user: CurrentUser
) {
  const db = getDb();
  const context = await db.query(
    `
      SELECT
        i.id AS inscricao_id,
        i.status AS inscricao_status,
        i.turma_id AS inscricao_turma_id,
        e.id AS encontro_id,
        e.status AS encontro_status,
        e.turma_id AS encontro_turma_id,
        t.instrutor_id
      FROM inscricoes i
      CROSS JOIN encontros e
      INNER JOIN turmas t ON t.id = i.turma_id
      WHERE i.id = $1
        AND e.id = $2
      LIMIT 1
    `,
    [input.inscricaoId, input.encontroId]
  );
  const item = context.rows[0] as
    | {
        inscricao_id: string;
        inscricao_status: string;
        inscricao_turma_id: string;
        encontro_id: string;
        encontro_status: string;
        encontro_turma_id: string;
        instrutor_id: string | null;
      }
    | undefined;

  if (!item) {
    throw new AttendanceRegistrationError(
      "ATTENDANCE_CONTEXT_NOT_FOUND",
      "Inscrição ou encontro não encontrado.",
      404
    );
  }

  if (item.inscricao_status === "cancelado") {
    throw new AttendanceRegistrationError(
      "ENROLLMENT_CANCELED",
      "Inscrição cancelada não aceita registro de presença.",
      409
    );
  }

  if (item.encontro_status === "cancelado") {
    throw new AttendanceRegistrationError(
      "MEETING_CANCELED",
      "Encontro cancelado não aceita registro de presença.",
      409
    );
  }

  if (item.inscricao_turma_id !== item.encontro_turma_id) {
    throw new AttendanceRegistrationError(
      "CLASS_MISMATCH",
      "Inscrição e encontro pertencem a turmas diferentes.",
      409
    );
  }

  if (!canManageAllAttendances(user)) {
    await assertAttendanceAssignment(user, item.inscricao_turma_id);
  }

  const result = await db.query(
    `
      INSERT INTO presencas (
        id, inscricao_id, encontro_id, status, metodo, registrado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, 'manual', now())
      ON CONFLICT (inscricao_id, encontro_id)
      DO UPDATE SET status = EXCLUDED.status, metodo = 'manual', registrado_em = now()
      RETURNING *
    `,
    [input.inscricaoId, input.encontroId, input.status]
  );

  await recalculateEnrollmentFrequency(input.inscricaoId);

  return result.rows[0];
}

export async function getAttendanceReportRows(
  user: CurrentUser,
  turmaId?: string
) {
  const db = getDb();

  if (turmaId) {
    await assertAttendanceReportClassAccess(user, turmaId);
  }

  const result = await db.query(
    `
      SELECT
        c.nome AS curso,
        t.nome AS turma,
        to_char(e.data, 'DD/MM/YYYY') AS encontro_data,
        to_char(e.horario_inicio, 'HH24:MI') || ' - ' || to_char(e.horario_fim, 'HH24:MI') AS horario,
        u.nome AS participante,
        u.email,
        i.status AS inscricao_status,
        COALESCE(p.status, 'nao_registrada') AS presenca_status,
        COALESCE(p.metodo, '-') AS metodo,
        i.percentual_frequencia,
        i.apto_certificado
      FROM inscricoes i
      INNER JOIN usuarios u ON u.id = i.usuario_id
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      INNER JOIN encontros e ON e.turma_id = t.id AND e.status <> 'cancelado'
      LEFT JOIN presencas p ON p.inscricao_id = i.id AND p.encontro_id = e.id
      WHERE ($1::uuid IS NULL OR t.id = $1::uuid)
        AND (
          $2::boolean = true
          OR EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $3::uuid AND vi.status = 'ativo'
          )
        )
      ORDER BY c.nome ASC, t.nome ASC, e.data ASC, u.nome ASC
    `,
    [turmaId ?? null, canManageAllAttendances(user), user.id]
  );

  return result.rows.map((item) => ({
    curso: item.curso,
    turma: item.turma,
    encontroData: item.encontro_data,
    horario: item.horario,
    participante: item.participante,
    email: item.email,
    inscricaoStatus: item.inscricao_status,
    presencaStatus: item.presenca_status,
    metodo: item.metodo,
    percentualFrequencia: String(item.percentual_frequencia),
    aptoCertificado: Boolean(item.apto_certificado)
  })) satisfies AttendanceReportRow[];
}

async function assertAttendanceReportClassAccess(
  user: CurrentUser,
  turmaId: string
) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT id, instrutor_id
      FROM turmas
      WHERE id = $1
      LIMIT 1
    `,
    [turmaId]
  );
  const turma = result.rows[0] as
    | { id: string; instrutor_id: string | null }
    | undefined;

  if (!turma) {
    throw new AttendanceReportAccessError(
      "CLASS_NOT_FOUND",
      "Turma não encontrada.",
      404
    );
  }

  if (!canManageAllAttendances(user)) {
    try {
      await assertActiveInstructorAssignment(user, turma.id);
    } catch (error) {
      if (error instanceof InstructorAssignmentError) {
        throw new AttendanceReportAccessError(error.code, error.message, error.status);
      }
      throw error;
    }
  }
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function attendanceReportToCsv(rows: AttendanceReportRow[]) {
  const header = [
    "curso",
    "turma",
    "encontro_data",
    "horario",
    "participante",
    "email",
    "inscricao_status",
    "presenca_status",
    "metodo",
    "percentual_frequencia",
    "apto_certificado"
  ];
  const lines = rows.map((row) =>
    [
      row.curso,
      row.turma,
      row.encontroData,
      row.horario,
      row.participante,
      row.email,
      row.inscricaoStatus,
      row.presencaStatus,
      row.metodo,
      row.percentualFrequencia,
      row.aptoCertificado
    ]
      .map(csvCell)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}
