import { type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import {
  assertActiveInstructorAssignment,
  InstructorAssignmentError
} from "@/lib/instructor-assignments";

export type MaterialType =
  | "link"
  | "pdf"
  | "video"
  | "apresentacao"
  | "documento"
  | "planilha"
  | "imagem"
  | "texto"
  | "atividade"
  | "referencia";

export type MaterialPublicationStatus = "rascunho" | "publicado" | "oculto";

export type MaterialSummary = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  url: string | null;
  situacao: string;
  ordem: number;
  curso: string;
  turma: string;
  aula: string;
  aulaId: string | null;
  autor: string | null;
  publicadoEm: string;
  canEdit: boolean;
};

export type MaterialLessonOption = {
  id: string;
  turmaId: string;
  turma: string;
  curso: string;
  data: string;
  horario: string;
  assignmentStatus: string | null;
};

export type CreateMaterialInput = {
  titulo: string;
  descricao?: string;
  tipo: MaterialType;
  url: string;
  situacao: MaterialPublicationStatus;
  aulaId: string;
  ordem?: number;
};

export type UpdateMaterialInput = Omit<CreateMaterialInput, "aulaId">;

export class MaterialCreationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "MaterialCreationError";
    this.code = code;
    this.status = status;
  }
}

export function isSafeMaterialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function canManageAllMaterials(user: CurrentUser) {
  return hasPermission(user, "materials.manage_all");
}

function assertMaterialPermission(user: CurrentUser, permission: string) {
  if (!canManageAllMaterials(user) && !hasPermission(user, permission)) {
    throw new MaterialCreationError(
      "MATERIAL_PERMISSION_REQUIRED",
      "Você não possui permissão para gerenciar materiais nesta aula.",
      403
    );
  }
}

async function assertMaterialAssignment(user: CurrentUser, turmaId: string) {
  try {
    await assertActiveInstructorAssignment(user, turmaId);
  } catch (error) {
    if (error instanceof InstructorAssignmentError) {
      const db = getDb();
      await db.query(
        `
          INSERT INTO logs_auditoria (
            id, usuario_id, acao, entidade, entidade_id, resumo
          )
          VALUES (
            gen_random_uuid(), $1, 'material.acesso_negado_sem_vinculo',
            'turmas', $2, 'Tentativa de gerenciar material sem vínculo ativo de Instrutor.'
          )
        `,
        [user.id, turmaId]
      );
      throw new MaterialCreationError(error.code, error.message, error.status);
    }
    throw error;
  }
}

async function getLessonContext(aulaId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        e.id AS aula_id,
        e.turma_id,
        t.curso_id,
        t.status AS turma_status,
        c.status AS curso_status
      FROM encontros e
      INNER JOIN turmas t ON t.id = e.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE e.id = $1
      LIMIT 1
    `,
    [aulaId]
  );

  if (!result.rows[0]) {
    throw new MaterialCreationError("LESSON_NOT_FOUND", "Aula não encontrada.", 404);
  }

  return result.rows[0] as {
    aula_id: string;
    turma_id: string;
    curso_id: string;
    turma_status: string;
    curso_status: string;
  };
}

async function assertInstructorCanMutateLesson(
  user: CurrentUser,
  lesson: { turma_id: string; turma_status: string; curso_status: string }
) {
  if (canManageAllMaterials(user)) {
    return;
  }

  await assertMaterialAssignment(user, lesson.turma_id);

  if (lesson.turma_status !== "publicada" || lesson.curso_status !== "publicado") {
    throw new MaterialCreationError(
      "CLASS_UNAVAILABLE",
      "Esta turma está concluída ou indisponível. Não é possível alterar materiais.",
      409
    );
  }
}

export async function listMaterialLessons(user: CurrentUser): Promise<MaterialLessonOption[]> {
  const db = getDb();
  const result = canManageAllMaterials(user)
    ? await db.query(`
        SELECT
          e.id,
          t.id AS turma_id,
          t.nome AS turma,
          c.nome AS curso,
          to_char(e.data, 'DD/MM/YYYY') AS data,
          to_char(e.horario_inicio, 'HH24:MI') AS horario,
          NULL::varchar AS assignment_status
        FROM encontros e
        INNER JOIN turmas t ON t.id = e.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        ORDER BY e.data DESC, e.horario_inicio DESC
      `)
    : await db.query(
        `
          SELECT
            e.id,
            t.id AS turma_id,
            t.nome AS turma,
            c.nome AS curso,
            to_char(e.data, 'DD/MM/YYYY') AS data,
            to_char(e.horario_inicio, 'HH24:MI') AS horario,
            vi.status AS assignment_status
          FROM encontros e
          INNER JOIN turmas t ON t.id = e.turma_id
          INNER JOIN cursos c ON c.id = t.curso_id
          INNER JOIN vinculos_instrutoria vi
            ON vi.turma_id = t.id
           AND vi.usuario_id = $1
           AND vi.status = 'ativo'
          WHERE t.status = 'publicada'
            AND c.status = 'publicado'
          ORDER BY e.data DESC, e.horario_inicio DESC
        `,
        [user.id]
      );

  return result.rows.map((row) => ({
    id: row.id,
    turmaId: row.turma_id,
    turma: row.turma,
    curso: row.curso,
    data: row.data,
    horario: row.horario,
    assignmentStatus: row.assignment_status
  }));
}

export async function listMaterials(user: CurrentUser): Promise<MaterialSummary[]> {
  const db = getDb();
  const manager = canManageAllMaterials(user);
  const result = manager
    ? await db.query(`
        SELECT
          m.id, m.titulo, m.descricao, m.tipo, m.url,
          m.status_publicacao, m.ordem, m.aula_id,
          c.nome AS curso, t.nome AS turma,
          CONCAT('Aula de ', to_char(e.data, 'DD/MM/YYYY'), ' às ', to_char(e.horario_inicio, 'HH24:MI')) AS aula,
          u.nome AS autor,
          to_char(m.publicado_em, 'DD/MM/YYYY') AS publicado_em,
          (m.aula_id IS NOT NULL) AS can_edit
        FROM materiais m
        LEFT JOIN turmas t ON t.id = m.turma_id
        INNER JOIN cursos c ON c.id = COALESCE(m.curso_id, t.curso_id)
        LEFT JOIN encontros e ON e.id = m.aula_id
        LEFT JOIN usuarios u ON u.id = m.publicado_por
        WHERE m.excluido_em IS NULL
        ORDER BY m.publicado_em DESC, m.ordem ASC, m.titulo ASC
      `)
    : await db.query(
        `
          SELECT
            m.id, m.titulo, m.descricao, m.tipo, m.url,
            m.status_publicacao, m.ordem, m.aula_id,
            c.nome AS curso, t.nome AS turma,
            CONCAT('Aula de ', to_char(e.data, 'DD/MM/YYYY'), ' às ', to_char(e.horario_inicio, 'HH24:MI')) AS aula,
            u.nome AS autor,
            to_char(m.publicado_em, 'DD/MM/YYYY') AS publicado_em,
            (m.aula_id IS NOT NULL AND vi.status = 'ativo' AND t.status = 'publicada' AND c.status = 'publicado') AS can_edit
          FROM materiais m
          INNER JOIN turmas t ON t.id = m.turma_id
          INNER JOIN cursos c ON c.id = COALESCE(m.curso_id, t.curso_id)
          LEFT JOIN encontros e ON e.id = m.aula_id
          LEFT JOIN usuarios u ON u.id = m.publicado_por
          INNER JOIN LATERAL (
            SELECT candidate.status
            FROM vinculos_instrutoria candidate
            WHERE candidate.turma_id = t.id
              AND candidate.usuario_id = $1
            ORDER BY candidate.criado_em DESC
            LIMIT 1
          ) vi ON true
          WHERE m.excluido_em IS NULL
          ORDER BY m.publicado_em DESC, m.ordem ASC, m.titulo ASC
        `,
        [user.id]
      );

  return result.rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    tipo: row.tipo,
    url: row.url,
    situacao: row.status_publicacao,
    ordem: Number(row.ordem),
    curso: row.curso,
    turma: row.turma,
    aula: row.aula ?? "Aula não vinculada",
    aulaId: row.aula_id,
    autor: row.autor,
    publicadoEm: row.publicado_em,
    canEdit: Boolean(row.can_edit)
  }));
}

export async function createMaterial(input: CreateMaterialInput, user: CurrentUser) {
  assertMaterialPermission(user, "materials.create_own_class");
  if (input.situacao === "publicado") {
    assertMaterialPermission(user, "materials.publish_own_class");
  }
  if (!isSafeMaterialUrl(input.url)) {
    throw new MaterialCreationError(
      "INVALID_MATERIAL_URL",
      "Informe um link de material válido usando http ou https.",
      422
    );
  }

  const lesson = await getLessonContext(input.aulaId);
  await assertInstructorCanMutateLesson(user, lesson);
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO materiais (
        id, curso_id, turma_id, aula_id, titulo, descricao, tipo, url,
        ordem, status_publicacao, visibilidade, publicado_por, atualizado_por,
        atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
        $8, $9, 'inscritos', $10, $10, now()
      )
      RETURNING id, titulo, status_publicacao
    `,
    [
      lesson.curso_id,
      lesson.turma_id,
      lesson.aula_id,
      input.titulo,
      input.descricao || null,
      input.tipo,
      input.url,
      input.ordem ?? 0,
      input.situacao,
      user.id
    ]
  );

  return result.rows[0];
}

async function findMaterialContext(materialId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        m.id, m.aula_id, m.status_publicacao, e.turma_id,
        t.status AS turma_status, c.status AS curso_status
      FROM materiais m
      INNER JOIN encontros e ON e.id = m.aula_id
      INNER JOIN turmas t ON t.id = e.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE m.id = $1
        AND m.excluido_em IS NULL
      LIMIT 1
    `,
    [materialId]
  );
  if (!result.rows[0]) {
    throw new MaterialCreationError("MATERIAL_NOT_FOUND", "Material não encontrado.", 404);
  }
  return result.rows[0] as {
    id: string;
    aula_id: string;
    turma_id: string;
    turma_status: string;
    curso_status: string;
    status_publicacao: string;
  };
}

export async function updateMaterialDetails(
  materialId: string,
  input: UpdateMaterialInput,
  user: CurrentUser
) {
  assertMaterialPermission(user, "materials.edit_own_class");
  if (input.situacao === "publicado") {
    assertMaterialPermission(user, "materials.publish_own_class");
  }
  if (!isSafeMaterialUrl(input.url)) {
    throw new MaterialCreationError(
      "INVALID_MATERIAL_URL",
      "Informe um link de material válido usando http ou https.",
      422
    );
  }

  const material = await findMaterialContext(materialId);
  await assertInstructorCanMutateLesson(user, material);
  const db = getDb();
  const result = await db.query(
    `
      UPDATE materiais
      SET titulo = $2,
          descricao = $3,
          tipo = $4,
          url = $5,
          ordem = $6,
          status_publicacao = $7,
          atualizado_por = $8,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, titulo, status_publicacao
    `,
    [
      materialId,
      input.titulo,
      input.descricao || null,
      input.tipo,
      input.url,
      input.ordem ?? 0,
      input.situacao,
      user.id
    ]
  );
  return result.rows[0];
}

export async function deleteMaterial(materialId: string, user: CurrentUser) {
  assertMaterialPermission(user, "materials.delete_own_class");
  const material = await findMaterialContext(materialId);
  await assertInstructorCanMutateLesson(user, material);
  const db = getDb();
  const result = await db.query(
    `
      UPDATE materiais
      SET excluido_em = now(),
          atualizado_por = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, titulo
    `,
    [materialId, user.id]
  );
  return result.rows[0];
}
