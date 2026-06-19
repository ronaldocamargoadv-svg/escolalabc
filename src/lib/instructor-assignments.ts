import type { PoolClient } from "pg";
import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export type InstructorAssignmentStatus =
  | "agendado"
  | "ativo"
  | "concluido"
  | "cancelado"
  | "expirado"
  | "removido";

export type InstructorAssignmentSummary = {
  id: string;
  usuarioId: string;
  instrutorNome: string;
  instrutorEmail: string;
  cursoNome: string;
  turmaId: string;
  turmaNome: string;
  status: InstructorAssignmentStatus;
  inicioEm: string | null;
  fimEm: string | null;
  atribuidoPorNome: string;
  motivoDesativacao: string | null;
};

type AssignmentInput = {
  turmaId: string;
  usuarioId: string;
  atribuidoPorUsuarioId: string;
  inicioEm?: string;
  fimEm?: string;
};

export class InstructorAssignmentError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 422) {
    super(message);
    this.name = "InstructorAssignmentError";
    this.code = code;
    this.status = status;
  }
}

function canManageAssignments(user: CurrentUser) {
  return (
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "instructor.assignment.create") ||
    hasPermission(user, "enrollments.manage")
  );
}

async function writeAutomaticLogs(
  action: string,
  reason: string,
  assignments: Array<{ id: string }>
) {
  if (!assignments.length) {
    return;
  }

  const db = getDb();
  for (const item of assignments) {
    await db.query(
      `
        INSERT INTO logs_auditoria (id, acao, entidade, entidade_id, resumo)
        VALUES (gen_random_uuid(), $1, 'vinculos_instrutoria', $2, $3)
      `,
      [action, item.id, reason]
    );
  }
}

export async function reconcileInstructorAssignments() {
  const db = getDb();
  const concluded = await db.query(
    `
      UPDATE vinculos_instrutoria vi
      SET status = 'concluido',
          desativado_em = now(),
          motivo_desativacao = 'Turma concluída',
          atualizado_em = now()
      FROM turmas t
      WHERE t.id = vi.turma_id
        AND vi.status IN ('agendado', 'ativo')
        AND t.status = 'encerrada'
      RETURNING vi.id
    `
  );
  const cancelled = await db.query(
    `
      UPDATE vinculos_instrutoria vi
      SET status = 'cancelado',
          desativado_em = now(),
          motivo_desativacao = 'Turma cancelada',
          atualizado_em = now()
      FROM turmas t
      WHERE t.id = vi.turma_id
        AND vi.status IN ('agendado', 'ativo')
        AND t.status = 'cancelada'
      RETURNING vi.id
    `
  );
  const expired = await db.query(
    `
      UPDATE vinculos_instrutoria
      SET status = 'expirado',
          desativado_em = now(),
          motivo_desativacao = 'Período de atuação encerrado',
          atualizado_em = now()
      WHERE status IN ('agendado', 'ativo')
        AND fim_em IS NOT NULL
        AND fim_em < CURRENT_DATE
      RETURNING id
    `
  );
  await db.query(
    `
      UPDATE vinculos_instrutoria vi
      SET status = 'ativo',
          atualizado_em = now()
      FROM turmas t
      WHERE t.id = vi.turma_id
        AND vi.status = 'agendado'
        AND t.status = 'publicada'
        AND (vi.inicio_em IS NULL OR vi.inicio_em <= CURRENT_DATE)
        AND (vi.fim_em IS NULL OR vi.fim_em >= CURRENT_DATE)
    `
  );

  await Promise.all([
    writeAutomaticLogs(
      "instrutoria.concluida_automatica",
      "Turma concluída. O vínculo de instrutoria foi encerrado.",
      concluded.rows
    ),
    writeAutomaticLogs(
      "instrutoria.cancelada_automatica",
      "Turma cancelada. O vínculo de instrutoria foi encerrado.",
      cancelled.rows
    ),
    writeAutomaticLogs(
      "instrutoria.expirada_automatica",
      "Período de atuação encerrado. O vínculo de instrutoria expirou.",
      expired.rows
    )
  ]);
}

export async function assertActiveInstructorAssignment(
  user: CurrentUser,
  turmaId: string
) {
  if (canManageAssignments(user)) {
    return;
  }

  await reconcileInstructorAssignments();
  const db = getDb();
  const result = await db.query(
    `
      SELECT vi.id
      FROM vinculos_instrutoria vi
      INNER JOIN turmas t ON t.id = vi.turma_id
      INNER JOIN usuarios u ON u.id = vi.usuario_id
      WHERE vi.usuario_id = $1
        AND vi.turma_id = $2
        AND vi.status = 'ativo'
        AND t.status = 'publicada'
        AND u.status = 'ativo'
      LIMIT 1
    `,
    [user.id, turmaId]
  );

  if (!result.rows[0]) {
    await db.query(
      `
        INSERT INTO logs_auditoria (
          id, usuario_id, acao, entidade, entidade_id, resumo
        )
        VALUES (
          gen_random_uuid(), $1, 'instrutoria.acesso_negado_sem_vinculo',
          'turmas', $2, 'Tentativa de atuação sem vínculo ativo de Instrutor.'
        )
      `,
      [user.id, turmaId]
    );
    throw new InstructorAssignmentError(
      "INSTRUCTOR_ASSIGNMENT_REQUIRED",
      "Você não possui vínculo ativo de Instrutor com esta turma.",
      403
    );
  }
}

export async function getInstructorAccessSummary(userId: string) {
  await reconcileInstructorAssignments();
  const db = getDb();
  const result = await db.query(
    `
      SELECT status, COUNT(*)::int AS total
      FROM vinculos_instrutoria
      WHERE usuario_id = $1
      GROUP BY status
    `,
    [userId]
  );
  const counts = Object.fromEntries(
    result.rows.map((row) => [row.status, Number(row.total)])
  ) as Partial<Record<InstructorAssignmentStatus, number>>;

  return {
    ativo: counts.ativo ?? 0,
    agendado: counts.agendado ?? 0,
    concluido: counts.concluido ?? 0,
    cancelado: counts.cancelado ?? 0,
    expirado: counts.expirado ?? 0,
    removido: counts.removido ?? 0,
    canOperate: Boolean(counts.ativo)
  };
}

export async function listInstructorAssignments(user: CurrentUser) {
  await reconcileInstructorAssignments();
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        vi.id,
        vi.usuario_id,
        u.nome AS instrutor_nome,
        u.email AS instrutor_email,
        c.nome AS curso_nome,
        vi.turma_id,
        t.nome AS turma_nome,
        vi.status,
        to_char(vi.inicio_em, 'DD/MM/YYYY') AS inicio_em,
        to_char(vi.fim_em, 'DD/MM/YYYY') AS fim_em,
        creator.nome AS atribuido_por_nome,
        vi.motivo_desativacao
      FROM vinculos_instrutoria vi
      INNER JOIN usuarios u ON u.id = vi.usuario_id
      INNER JOIN cursos c ON c.id = vi.curso_id
      INNER JOIN turmas t ON t.id = vi.turma_id
      INNER JOIN usuarios creator ON creator.id = vi.atribuido_por_usuario_id
      WHERE ($1::boolean OR vi.usuario_id = $2)
      ORDER BY vi.criado_em DESC
    `,
    [canManageAssignments(user), user.id]
  );

  return result.rows.map((row) => ({
    id: row.id,
    usuarioId: row.usuario_id,
    instrutorNome: row.instrutor_nome,
    instrutorEmail: row.instrutor_email,
    cursoNome: row.curso_nome,
    turmaId: row.turma_id,
    turmaNome: row.turma_nome,
    status: row.status,
    inicioEm: row.inicio_em,
    fimEm: row.fim_em,
    atribuidoPorNome: row.atribuido_por_nome,
    motivoDesativacao: row.motivo_desativacao
  })) as InstructorAssignmentSummary[];
}

export async function createInstructorAssignmentWithClient(
  client: Pick<PoolClient, "query">,
  input: AssignmentInput
) {
  const classResult = await client.query(
    `
      SELECT t.id, t.curso_id, t.status, t.data_inicio, t.data_fim
      FROM turmas t
      WHERE t.id = $1
      LIMIT 1
    `,
    [input.turmaId]
  );
  const turma = classResult.rows[0] as
    | { id: string; curso_id: string; status: string; data_inicio: Date; data_fim: Date | null }
    | undefined;

  if (!turma || ["encerrada", "cancelada"].includes(turma.status)) {
    throw new InstructorAssignmentError(
      "CLASS_UNAVAILABLE",
      "Selecione uma turma ativa ou futura para vincular o Instrutor."
    );
  }

  const userResult = await client.query(
    `
      SELECT u.id
      FROM usuarios u
      WHERE u.id = $1 AND u.status = 'ativo'
      LIMIT 1
    `,
    [input.usuarioId]
  );
  if (!userResult.rows[0]) {
    throw new InstructorAssignmentError(
      "INSTRUCTOR_NOT_FOUND",
      "Instrutor ativo não encontrado."
    );
  }
  await client.query(
    `
      INSERT INTO usuario_perfis (usuario_id, perfil_id)
      SELECT $1, id FROM perfis WHERE nome = 'instrutor'
      ON CONFLICT DO NOTHING
    `,
    [input.usuarioId]
  );

  const inicioEm = input.inicioEm || turma.data_inicio;
  const fimEm = input.fimEm || turma.data_fim;
  const activeNow =
    turma.status === "publicada" &&
    new Date(inicioEm).getTime() <= Date.now() &&
    (!fimEm || new Date(fimEm).getTime() >= Date.now());
  const status: InstructorAssignmentStatus = activeNow ? "ativo" : "agendado";

  const existing = await client.query(
    `
      SELECT id
      FROM vinculos_instrutoria
      WHERE turma_id = $1
        AND usuario_id = $2
        AND status IN ('agendado', 'ativo')
      LIMIT 1
    `,
    [input.turmaId, input.usuarioId]
  );
  if (existing.rows[0]) {
    const updated = await client.query(
      `
        UPDATE vinculos_instrutoria
        SET status = $2, inicio_em = $3, fim_em = $4, atualizado_em = now()
        WHERE id = $1
        RETURNING id, status
      `,
      [existing.rows[0].id, status, inicioEm, fimEm]
    );
    return updated.rows[0] as { id: string; status: InstructorAssignmentStatus };
  }

  await client.query(
    `
      UPDATE vinculos_instrutoria
      SET status = 'removido', desativado_em = now(),
          motivo_desativacao = 'Substituição de instrutor', atualizado_em = now()
      WHERE turma_id = $1 AND status IN ('agendado', 'ativo')
    `,
    [input.turmaId]
  );
  const result = await client.query(
    `
      INSERT INTO vinculos_instrutoria (
        id, usuario_id, curso_id, turma_id, atribuido_por_usuario_id,
        status, inicio_em, fim_em, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now())
      RETURNING id, status
    `,
    [
      input.usuarioId,
      turma.curso_id,
      input.turmaId,
      input.atribuidoPorUsuarioId,
      status,
      inicioEm,
      fimEm
    ]
  );
  await client.query(
    "UPDATE turmas SET instrutor_id = $2, atualizado_em = now() WHERE id = $1",
    [input.turmaId, input.usuarioId]
  );

  return result.rows[0] as { id: string; status: InstructorAssignmentStatus };
}

export async function createInstructorAssignment(input: AssignmentInput) {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const assignment = await createInstructorAssignmentWithClient(client, input);
    await client.query("COMMIT");
    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deactivateInstructorAssignmentsForClass(
  turmaId: string,
  status: "concluido" | "cancelado",
  reason: string
) {
  const db = getDb();
  return db.query(
    `
      UPDATE vinculos_instrutoria
      SET status = $2, desativado_em = now(), motivo_desativacao = $3,
          atualizado_em = now()
      WHERE turma_id = $1 AND status IN ('agendado', 'ativo')
      RETURNING id
    `,
    [turmaId, status, reason]
  );
}

export async function removeInstructorAssignment(id: string) {
  const db = getDb();
  const result = await db.query(
    `
      UPDATE vinculos_instrutoria
      SET status = 'removido', desativado_em = now(),
          motivo_desativacao = 'Vínculo removido pelo Administrador',
          atualizado_em = now()
      WHERE id = $1 AND status IN ('agendado', 'ativo')
      RETURNING id, turma_id
    `,
    [id]
  );
  const item = result.rows[0] as { id: string; turma_id: string } | undefined;
  if (item) {
    await db.query(
      `
        UPDATE turmas
        SET instrutor_id = NULL, atualizado_em = now()
        WHERE id = $1
          AND NOT EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = $1 AND vi.status IN ('agendado', 'ativo')
          )
      `,
      [item.turma_id]
    );
  }
  return item;
}
