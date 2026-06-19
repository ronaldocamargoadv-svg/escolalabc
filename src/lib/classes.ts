import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  createInstructorAssignment,
  deactivateInstructorAssignmentsForClass,
  reconcileInstructorAssignments,
  removeInstructorAssignment
} from "@/lib/instructor-assignments";
import { hasPermission } from "@/lib/permissions";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";

export type ClassSummary = {
  id: string;
  cursoId: string;
  nome: string;
  cursoNome: string;
  cursoStatus: string;
  instrutorId: string | null;
  instrutorNome: string | null;
  modalidade: string;
  vagas: number;
  dataInicio: string;
  dataInicioInput: string;
  dataFimInput: string | null;
  criterioFrequenciaMinima: string;
  local: string | null;
  linkOnline: string | null;
  status: string;
  instrutoriaStatus: string | null;
  hasValidCertificates: boolean;
};

export type ClassDetails = ClassSummary;

export type ClassStatus = "rascunho" | "publicada" | "cancelada" | "encerrada";

export type CreateClassInput = {
  cursoId: string;
  nome: string;
  dataInicio: string;
  dataFim?: string;
  vagas: number;
  modalidade: "presencial" | "online" | "hibrido";
  local?: string;
  linkOnline?: string;
  criterioFrequenciaMinima: number;
  instrutorId?: string;
};

export type UpdateClassInput = Omit<CreateClassInput, "cursoId">;

export class CourseUnavailableForClassError extends Error {
  constructor(message = "Cursos arquivados não aceitam novas turmas.") {
    super(message);
    this.name = "CourseUnavailableForClassError";
  }
}

export class ClassInstructorError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 422) {
    super(message);
    this.name = "ClassInstructorError";
    this.code = code;
    this.status = status;
  }
}

export class ClassStatusError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 409) {
    super(message);
    this.name = "ClassStatusError";
    this.code = code;
    this.status = status;
  }
}

function canSeeAllClasses(user?: CurrentUser) {
  return (
    !user ||
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "courses.publish") ||
    hasPermission(user, "enrollments.manage")
  );
}

export async function listClasses(user?: CurrentUser): Promise<ClassSummary[]> {
  await reconcileInstructorAssignments();
  const db = getDb();
  const result = canSeeAllClasses(user)
    ? await db.query(`
    SELECT
      t.id,
      t.curso_id,
      t.nome,
      c.nome AS curso_nome,
      c.status AS curso_status,
      t.instrutor_id,
      instrutor.nome AS instrutor_nome,
      t.modalidade,
      t.vagas,
      to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
      to_char(t.data_inicio, 'YYYY-MM-DD') AS data_inicio_input,
      to_char(t.data_fim, 'YYYY-MM-DD') AS data_fim_input,
      t.criterio_frequencia_minima,
      t.local,
      t.link_online,
      t.status,
      latest_assignment.status AS instrutoria_status,
      EXISTS (
        SELECT 1
        FROM certificados cert
        INNER JOIN inscricoes i ON i.id = cert.inscricao_id
        WHERE i.turma_id = t.id
          AND cert.status = 'valido'
      ) AS has_valid_certificates
    FROM turmas t
    INNER JOIN cursos c ON c.id = t.curso_id
    LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
    LEFT JOIN LATERAL (
      SELECT vi.status
      FROM vinculos_instrutoria vi
      WHERE vi.turma_id = t.id
      ORDER BY vi.criado_em DESC
      LIMIT 1
    ) latest_assignment ON true
    ORDER BY t.criado_em DESC
  `)
    : await db.query(
        `
          SELECT
            t.id,
            t.curso_id,
            t.nome,
            c.nome AS curso_nome,
            c.status AS curso_status,
            t.instrutor_id,
            instrutor.nome AS instrutor_nome,
            t.modalidade,
            t.vagas,
            to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
            to_char(t.data_inicio, 'YYYY-MM-DD') AS data_inicio_input,
            to_char(t.data_fim, 'YYYY-MM-DD') AS data_fim_input,
            t.criterio_frequencia_minima,
            t.local,
            t.link_online,
            t.status,
            latest_assignment.status AS instrutoria_status,
            EXISTS (
              SELECT 1
              FROM certificados cert
              INNER JOIN inscricoes cert_i ON cert_i.id = cert.inscricao_id
              WHERE cert_i.turma_id = t.id
                AND cert.status = 'valido'
            ) AS has_valid_certificates
          FROM turmas t
          INNER JOIN cursos c ON c.id = t.curso_id
          LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
          LEFT JOIN LATERAL (
            SELECT vi.status
            FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1
            ORDER BY vi.criado_em DESC
            LIMIT 1
          ) latest_assignment ON true
          WHERE EXISTS (
               SELECT 1
               FROM vinculos_instrutoria vi
               WHERE vi.turma_id = t.id
                 AND vi.usuario_id = $1
             )
             OR EXISTS (
               SELECT 1
               FROM inscricoes i
               WHERE i.turma_id = t.id
                 AND i.usuario_id = $1
                 AND i.status <> 'cancelado'
             )
          ORDER BY t.criado_em DESC
        `,
        [user?.id]
      );

  return result.rows.map((item) => ({
    id: item.id,
    cursoId: item.curso_id,
    nome: item.nome,
    cursoNome: item.curso_nome,
    cursoStatus: item.curso_status,
    instrutorId: item.instrutor_id,
    instrutorNome: item.instrutor_nome,
    modalidade: item.modalidade,
    vagas: Number(item.vagas),
    dataInicio: item.data_inicio,
    dataInicioInput: item.data_inicio_input,
    dataFimInput: item.data_fim_input,
    criterioFrequenciaMinima: String(item.criterio_frequencia_minima),
    local: item.local,
    linkOnline: item.link_online,
    status: item.status,
    instrutoriaStatus: item.instrutoria_status,
    hasValidCertificates: Boolean(item.has_valid_certificates)
  }));
}

export async function getClassDetails(classId: string) {
  await reconcileInstructorAssignments();
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        t.id,
        t.curso_id,
        t.nome,
        c.nome AS curso_nome,
        c.status AS curso_status,
        t.instrutor_id,
        instrutor.nome AS instrutor_nome,
        t.modalidade,
        t.vagas,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        to_char(t.data_inicio, 'YYYY-MM-DD') AS data_inicio_input,
        to_char(t.data_fim, 'YYYY-MM-DD') AS data_fim_input,
        t.criterio_frequencia_minima,
        t.local,
        t.link_online,
        t.status,
        latest_assignment.status AS instrutoria_status,
        EXISTS (
          SELECT 1
          FROM certificados cert
          INNER JOIN inscricoes i ON i.id = cert.inscricao_id
          WHERE i.turma_id = t.id
            AND cert.status = 'valido'
        ) AS has_valid_certificates
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
      LEFT JOIN LATERAL (
        SELECT vi.status
        FROM vinculos_instrutoria vi
        WHERE vi.turma_id = t.id
        ORDER BY vi.criado_em DESC
        LIMIT 1
      ) latest_assignment ON true
      WHERE t.id = $1
      LIMIT 1
    `,
    [classId]
  );
  const item = result.rows[0];

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    cursoId: item.curso_id,
    nome: item.nome,
    cursoNome: item.curso_nome,
    cursoStatus: item.curso_status,
    instrutorId: item.instrutor_id,
    instrutorNome: item.instrutor_nome,
    modalidade: item.modalidade,
    vagas: Number(item.vagas),
    dataInicio: item.data_inicio,
    dataInicioInput: item.data_inicio_input,
    dataFimInput: item.data_fim_input,
    criterioFrequenciaMinima: String(item.criterio_frequencia_minima),
    local: item.local,
    linkOnline: item.link_online,
    status: item.status,
    instrutoriaStatus: item.instrutoria_status,
    hasValidCertificates: Boolean(item.has_valid_certificates)
  } satisfies ClassDetails;
}

export async function updateClassDetails(
  classId: string,
  input: UpdateClassInput,
  assignedByUserId?: string
) {
  if (!isSafeExternalUrl(input.linkOnline)) {
    throw new ClassStatusError("INVALID_ONLINE_LINK", SAFE_EXTERNAL_URL_MESSAGE, 422);
  }

  await assertClassHasNoValidCertificates(classId);

  const db = getDb();
  const current = await db.query("SELECT instrutor_id FROM turmas WHERE id = $1", [
    classId
  ]);
  const result = await db.query(
    `
      UPDATE turmas
      SET nome = $2,
          data_inicio = $3,
          data_fim = $4,
          vagas = $5,
          modalidade = $6,
          local = $7,
          link_online = $8,
          criterio_frequencia_minima = $9,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome
    `,
    [
      classId,
      input.nome,
      input.dataInicio,
      input.dataFim || null,
      input.vagas,
      input.modalidade,
      input.local || null,
      input.linkOnline || null,
      input.criterioFrequenciaMinima
    ]
  );

  if (
    result.rows[0] &&
    current.rows[0]?.instrutor_id !== (input.instrutorId || null)
  ) {
    await updateClassInstructor(classId, input.instrutorId, assignedByUserId);
  }

  return result.rows[0] as { id: string; nome: string } | undefined;
}

export async function updateClassInstructor(
  classId: string,
  instructorId?: string,
  assignedByUserId?: string
) {
  await assertClassHasNoValidCertificatesForInstructorChange(classId);

  if (instructorId) {
    await assertActiveInstructor(instructorId);
    if (!assignedByUserId) {
      throw new ClassInstructorError(
        "ASSIGNMENT_CREATOR_REQUIRED",
        "Não foi possível identificar quem criou o vínculo."
      );
    }
    await createInstructorAssignment({
      turmaId: classId,
      usuarioId: instructorId,
      atribuidoPorUsuarioId: assignedByUserId
    });
  } else {
    const active = await getDb().query(
      `
        SELECT id FROM vinculos_instrutoria
        WHERE turma_id = $1 AND status IN ('agendado', 'ativo')
      `,
      [classId]
    );
    for (const assignment of active.rows) {
      await removeInstructorAssignment(assignment.id);
    }
  }

  const db = getDb();
  const result = await db.query(
    `
      UPDATE turmas
      SET instrutor_id = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome, instrutor_id
    `,
    [classId, instructorId || null]
  );

  return result.rows[0] as
    | { id: string; nome: string; instrutor_id: string | null }
    | undefined;
}

export async function updateClassStatus(classId: string, status: ClassStatus) {
  const db = getDb();
  if (status === "rascunho" || status === "cancelada") {
    await assertClassHasNoValidCertificates(classId);
  }

  if (status === "publicada") {
    const courseResult = await db.query(
      `
        SELECT c.status
        FROM turmas t
        INNER JOIN cursos c ON c.id = t.curso_id
        WHERE t.id = $1
      `,
      [classId]
    );
    const course = courseResult.rows[0] as
      | { status: string }
      | undefined;

    if (!course) {
      return undefined;
    }

    if (course.status !== "publicado") {
      throw new CourseUnavailableForClassError(
        "Apenas turmas de cursos publicados podem ser publicadas."
      );
    }
  }

  const result = await db.query(
    `
      UPDATE turmas
      SET status = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome, status
    `,
    [classId, status]
  );

  if (result.rows[0] && status === "encerrada") {
    await deactivateInstructorAssignmentsForClass(
      classId,
      "concluido",
      "Turma concluída"
    );
  }
  if (result.rows[0] && status === "cancelada") {
    await deactivateInstructorAssignmentsForClass(
      classId,
      "cancelado",
      "Turma cancelada"
    );
  }

  return result.rows[0] as
    | { id: string; nome: string; status: ClassStatus }
    | undefined;
}

async function assertClassHasNoValidCertificates(classId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT cert.id
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      WHERE i.turma_id = $1
        AND cert.status = 'valido'
      LIMIT 1
    `,
    [classId]
  );

  if (result.rows[0]) {
    throw new ClassStatusError(
      "VALID_CERTIFICATES_EXIST",
      "Turma com certificado válido não pode voltar a rascunho nem ser cancelada."
    );
  }
}

async function assertClassHasNoValidCertificatesForInstructorChange(
  classId: string
) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT cert.id
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      WHERE i.turma_id = $1
        AND cert.status = 'valido'
      LIMIT 1
    `,
    [classId]
  );

  if (result.rows[0]) {
    throw new ClassInstructorError(
      "VALID_CERTIFICATES_EXIST",
      "Instrutor de turma com certificado válido não pode ser alterado.",
      409
    );
  }
}

export async function createClass(input: CreateClassInput, assignedByUserId?: string) {
  if (!isSafeExternalUrl(input.linkOnline)) {
    throw new ClassStatusError("INVALID_ONLINE_LINK", SAFE_EXTERNAL_URL_MESSAGE, 422);
  }

  const db = getDb();
  const courseResult = await db.query(
    "SELECT id, status FROM cursos WHERE id = $1",
    [input.cursoId]
  );
  const course = courseResult.rows[0] as
    | { id: string; status: string }
    | undefined;

  if (!course) {
    return undefined;
  }

  if (course.status === "arquivado") {
    throw new CourseUnavailableForClassError();
  }

  const result = await db.query(
    `
      INSERT INTO turmas (
        id, curso_id, nome, data_inicio, data_fim, vagas, modalidade, local,
        link_online, criterio_frequencia_minima, status, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'rascunho', now()
      )
      RETURNING *
    `,
    [
      input.cursoId,
      input.nome,
      input.dataInicio,
      input.dataFim || null,
      input.vagas,
      input.modalidade,
      input.local || null,
      input.linkOnline || null,
      input.criterioFrequenciaMinima
    ]
  );

  if (result.rows[0] && input.instrutorId) {
    if (!assignedByUserId) {
      throw new ClassInstructorError(
        "ASSIGNMENT_CREATOR_REQUIRED",
        "Não foi possível identificar quem criou o vínculo."
      );
    }
    await updateClassInstructor(result.rows[0].id, input.instrutorId, assignedByUserId);
  }

  return result.rows[0];
}

async function assertActiveInstructor(instructorId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT u.id
      FROM usuarios u
      WHERE u.id = $1
        AND u.status = 'ativo'
      LIMIT 1
    `,
    [instructorId]
  );

  if (!result.rows[0]) {
    throw new ClassInstructorError(
      "INSTRUCTOR_NOT_FOUND",
      "Usuário ativo não encontrado para o vínculo de Instrutor."
    );
  }
}
