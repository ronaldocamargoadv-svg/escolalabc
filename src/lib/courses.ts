import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export type CourseSummary = {
  id: string;
  nome: string;
  modalidade: string;
  cargaHoraria: string;
  status: string;
  tema: string | null;
  ementa: string;
  turmas: number;
  hasValidCertificates: boolean;
};

export type CourseStatus = "rascunho" | "publicado" | "arquivado";

export type CourseDetails = {
  id: string;
  nome: string;
  modalidade: "presencial" | "online" | "hibrido";
  cargaHoraria: string;
  tema: string | null;
  ementa: string;
  status: string;
};

export type UpdateCourseInput = {
  nome: string;
  modalidade: "presencial" | "online" | "hibrido";
  cargaHoraria: number;
  ementa: string;
  tema?: string;
};

export class CourseStatusError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 409) {
    super(message);
    this.name = "CourseStatusError";
    this.code = code;
    this.status = status;
  }
}

function canSeeAllCourses(user?: CurrentUser) {
  return (
    !user ||
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "courses.publish")
  );
}

export async function listCourses(user?: CurrentUser): Promise<CourseSummary[]> {
  const db = getDb();
  if (canSeeAllCourses(user)) {
    const result = await db.query(`
      SELECT
        c.id,
        c.nome,
        c.carga_horaria,
        c.modalidade,
        c.tema,
        c.ementa,
        c.status,
        COUNT(t.id)::int AS turmas,
        EXISTS (
          SELECT 1
          FROM certificados cert
          INNER JOIN inscricoes i ON i.id = cert.inscricao_id
          INNER JOIN turmas cert_turma ON cert_turma.id = i.turma_id
          WHERE cert_turma.curso_id = c.id
            AND cert.status = 'valido'
        ) AS has_valid_certificates
      FROM cursos c
      LEFT JOIN turmas t ON t.curso_id = c.id
      GROUP BY c.id
      ORDER BY c.criado_em DESC
    `);

    return mapCourseRows(result.rows);
  }

  const result =
    user
    ? await db.query(`
          SELECT
            c.id,
            c.nome,
            c.carga_horaria,
            c.modalidade,
            c.tema,
            c.ementa,
            c.status,
            COUNT(t.id)::int AS turmas,
            EXISTS (
              SELECT 1
              FROM certificados cert
              INNER JOIN inscricoes i ON i.id = cert.inscricao_id
              INNER JOIN turmas cert_turma ON cert_turma.id = i.turma_id
              WHERE cert_turma.curso_id = c.id
                AND cert.status = 'valido'
            ) AS has_valid_certificates
          FROM cursos c
          INNER JOIN turmas t ON t.curso_id = c.id
          WHERE EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status IN ('ativo', 'agendado', 'concluido')
          )
          GROUP BY c.id
          ORDER BY c.criado_em DESC
        `,
        [user.id]
      )
    : { rows: [] };

  return mapCourseRows(result.rows);
}

export async function getCourseDetails(courseId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        id,
        nome,
        modalidade,
        carga_horaria,
        tema,
        ementa,
        status
      FROM cursos
      WHERE id = $1
      LIMIT 1
    `,
    [courseId]
  );
  const course = result.rows[0];

  if (!course) {
    return null;
  }

  return {
    id: String(course.id),
    nome: String(course.nome),
    modalidade: course.modalidade as CourseDetails["modalidade"],
    cargaHoraria: String(course.carga_horaria),
    tema: course.tema ? String(course.tema) : null,
    ementa: String(course.ementa),
    status: String(course.status)
  } satisfies CourseDetails;
}

function mapCourseRows(rows: Record<string, unknown>[]) {
  return rows.map((course) => ({
    id: String(course.id),
    nome: String(course.nome),
    modalidade: String(course.modalidade),
    cargaHoraria: String(course.carga_horaria),
    tema: course.tema ? String(course.tema) : null,
    ementa: String(course.ementa),
    status: String(course.status),
    turmas: Number(course.turmas),
    hasValidCertificates: Boolean(course.has_valid_certificates)
  }));
}

export async function updateCourseDetails(
  courseId: string,
  input: UpdateCourseInput
) {
  const db = getDb();
  const result = await db.query(
    `
      UPDATE cursos
      SET nome = $2,
          modalidade = $3,
          carga_horaria = $4,
          ementa = $5,
          tema = $6,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome
    `,
    [
      courseId,
      input.nome,
      input.modalidade,
      input.cargaHoraria,
      input.ementa,
      input.tema || null
    ]
  );

  return result.rows[0] as { id: string; nome: string } | undefined;
}

export async function updateCourseStatus(courseId: string, status: CourseStatus) {
  const db = getDb();
  if (status === "rascunho" || status === "arquivado") {
    await assertCourseHasNoValidCertificates(courseId);
  }

  const result = await db.query(
    `
      UPDATE cursos
      SET status = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome, status
    `,
    [courseId, status]
  );

  return result.rows[0] as
    | { id: string; nome: string; status: CourseStatus }
    | undefined;
}

async function assertCourseHasNoValidCertificates(courseId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT cert.id
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      INNER JOIN turmas t ON t.id = i.turma_id
      WHERE t.curso_id = $1
        AND cert.status = 'valido'
      LIMIT 1
    `,
    [courseId]
  );

  if (result.rows[0]) {
    throw new CourseStatusError(
      "VALID_CERTIFICATES_EXIST",
      "Curso com certificado válido não pode voltar a rascunho nem ser arquivado."
    );
  }
}
