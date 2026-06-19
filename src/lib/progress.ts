import { getDb } from "@/lib/db";
import { maybeAutoIssueCertificate } from "@/lib/certification-automation";
import { refreshEnrollmentCertificationEligibility } from "@/lib/evaluations";
import { type CurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export type LearningStatus =
  | "not_started"
  | "started"
  | "in_progress"
  | "completed";

export type EngagementFilters = {
  cursoId?: string;
  turmaId?: string;
  aluno?: string;
  status?: string;
};

export type EngagementSummary = {
  inscricaoId: string;
  alunoId: string;
  aluno: string;
  email: string;
  cursoId: string;
  curso: string;
  turmaId: string;
  turma: string;
  instrutor: string | null;
  status: LearningStatus;
  progresso: string;
  aulasAcessadas: number;
  aulasConcluidas: number;
  totalAulas: number;
  primeiroAcesso: string | null;
  ultimoAcesso: string | null;
  certificado: string;
};

export type EngagementMetrics = {
  totalAlunos: number;
  naoIniciados: number;
  emAndamento: number;
  concluidos: number;
  mediaProgresso: number;
  semAcesso7Dias: number;
};

export type EngagementOptions = {
  cursos: { id: string; nome: string }[];
  turmas: { id: string; nome: string; cursoId: string }[];
};

export type EngagementDetail = {
  summary: EngagementSummary & {
    statusInscricao: string;
    orgaoSecretaria: string | null;
    cargo: string | null;
  };
  aulas: {
    id: string;
    titulo: string;
    data: string;
    modalidade: string;
    acessada: boolean;
    quantidadeAcessos: number;
    primeiroAcesso: string | null;
    ultimoAcesso: string | null;
    concluida: boolean;
    concluidoEm: string | null;
  }[];
  eventos: {
    id: string;
    tipo: string;
    aula: string | null;
    criadoEm: string;
  }[];
  forumPosts: number;
  pendenciasCertificacao: string[];
};

type EnrollmentContext = {
  inscricaoId: string;
  usuarioId: string;
  cursoId: string;
  turmaId: string;
};

export class ProgressAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "ProgressAccessError";
    this.status = status;
  }
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    not_started: "Não iniciado",
    started: "Iniciado",
    in_progress: "Em andamento",
    completed: "Concluído"
  };

  return labels[status] ?? status;
}

export async function recordCourseOpened(userId: string, turmaId: string) {
  const context = await getEnrollmentContext(userId, turmaId);
  const progress = await ensureCourseProgress(context);
  const wasStarted = Boolean(progress.iniciado_em);
  const db = getDb();

  await db.query(
    `
      UPDATE progresso_cursos
      SET status = CASE
            WHEN status = 'not_started' THEN 'started'
            ELSE status
          END,
          iniciado_em = COALESCE(iniciado_em, now()),
          ultimo_acesso_em = now(),
          atualizado_em = now()
      WHERE inscricao_id = $1
    `,
    [context.inscricaoId]
  );

  if (!wasStarted) {
    await insertLearningEvent({
      userId,
      courseId: context.cursoId,
      type: "course_started",
      metadata: { turmaId }
    });
  }

  await insertLearningEvent({
    userId,
    courseId: context.cursoId,
    type: "course_opened",
    metadata: { turmaId }
  });

  await recomputeCourseProgress(context.inscricaoId);
  await refreshEnrollmentCertificationEligibility(context.inscricaoId);
  await maybeAutoIssueCertificate(context.inscricaoId);
}

export async function recordLessonOpened(
  userId: string,
  turmaId: string,
  lessonId: string
) {
  const context = await assertLessonAccess(userId, turmaId, lessonId);
  await recordCourseOpened(userId, turmaId);
  const db = getDb();

  await db.query(
    `
      INSERT INTO acessos_aulas (
        id, usuario_id, curso_id, aula_id, primeiro_acesso_em,
        ultimo_acesso_em, quantidade_acessos, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, now(), now(), 1, now())
      ON CONFLICT (usuario_id, aula_id)
      DO UPDATE SET ultimo_acesso_em = now(),
                    quantidade_acessos = acessos_aulas.quantidade_acessos + 1,
                    atualizado_em = now()
    `,
    [userId, context.cursoId, lessonId]
  );

  await insertLearningEvent({
    userId,
    courseId: context.cursoId,
    lessonId,
    type: "lesson_opened",
    metadata: { turmaId }
  });

  await recomputeCourseProgress(context.inscricaoId);
  await refreshEnrollmentCertificationEligibility(context.inscricaoId);
  await maybeAutoIssueCertificate(context.inscricaoId);
}

export async function markLessonCompleted(
  userId: string,
  turmaId: string,
  lessonId: string
) {
  const context = await assertLessonAccess(userId, turmaId, lessonId);
  await recordCourseOpened(userId, turmaId);
  const db = getDb();
  const existing = await db.query(
    `
      SELECT id, concluida
      FROM acessos_aulas
      WHERE usuario_id = $1 AND aula_id = $2
      LIMIT 1
    `,
    [userId, lessonId]
  );
  const alreadyCompleted = Boolean(existing.rows[0]?.concluida);

  if (!existing.rows[0]) {
    await db.query(
      `
        INSERT INTO acessos_aulas (
          id, usuario_id, curso_id, aula_id, primeiro_acesso_em,
          ultimo_acesso_em, quantidade_acessos, atualizado_em
        )
        VALUES (gen_random_uuid(), $1, $2, $3, now(), now(), 1, now())
      `,
      [userId, context.cursoId, lessonId]
    );

    await insertLearningEvent({
      userId,
      courseId: context.cursoId,
      lessonId,
      type: "lesson_opened",
      metadata: { turmaId, origem: "conclusao_direta" }
    });
  } else {
    await db.query(
      `
        UPDATE acessos_aulas
        SET ultimo_acesso_em = now(),
            atualizado_em = now()
        WHERE usuario_id = $1
          AND aula_id = $2
      `,
      [userId, lessonId]
    );
  }

  await db.query(
    `
      UPDATE acessos_aulas
      SET concluida = true,
          concluido_em = COALESCE(concluido_em, now()),
          atualizado_em = now()
      WHERE usuario_id = $1
        AND aula_id = $2
    `,
    [userId, lessonId]
  );

  if (!alreadyCompleted) {
    await insertLearningEvent({
      userId,
      courseId: context.cursoId,
      lessonId,
      type: "lesson_completed",
      metadata: { turmaId }
    });
  }

  await recomputeCourseProgress(context.inscricaoId);
  await refreshEnrollmentCertificationEligibility(context.inscricaoId);
  await maybeAutoIssueCertificate(context.inscricaoId);
  await requestCertificateApprovalIfCompleted(context);
}

export async function recordMaterialOpened(
  userId: string,
  turmaId: string,
  materialId: string
) {
  const context = await getEnrollmentContext(userId, turmaId);
  const db = getDb();
  const material = await db.query(
    `
      SELECT m.id, m.aula_id, m.url
      FROM materiais m
      WHERE m.id = $1
        AND (
          m.turma_id = $2
          OR m.curso_id = $3
        )
        AND m.status_publicacao = 'publicado'
        AND m.excluido_em IS NULL
        AND m.visibilidade IN ('publico', 'inscritos')
      LIMIT 1
    `,
    [materialId, turmaId, context.cursoId]
  );

  if (!material.rows[0]) {
    throw new ProgressAccessError("Material não encontrado para esta turma.", 404);
  }
  const destination = material.rows[0].url as string | null;
  if (!destination || !/^https?:\/\//i.test(destination)) {
    throw new ProgressAccessError("Material sem link seguro disponível.", 409);
  }

  await recordCourseOpened(userId, turmaId);
  await insertLearningEvent({
    userId,
    courseId: context.cursoId,
    lessonId: material.rows[0].aula_id,
    type: "material_opened",
    metadata: { turmaId, materialId }
  });

  return destination;
}

export async function recordForumParticipation(userId: string, turmaId: string) {
  const db = getDb();
  const classResult = await db.query(
    "SELECT curso_id FROM turmas WHERE id = $1 LIMIT 1",
    [turmaId]
  );
  const courseId = classResult.rows[0]?.curso_id as string | undefined;

  if (!courseId) {
    return;
  }

  await insertLearningEvent({
    userId,
    courseId,
    type: "forum_posted",
    metadata: { turmaId }
  });

  const enrollment = await db.query(
    `
      SELECT id
      FROM inscricoes
      WHERE usuario_id = $1
        AND turma_id = $2
        AND status <> 'cancelado'
      LIMIT 1
    `,
    [userId, turmaId]
  );

  if (enrollment.rows[0]) {
    await recomputeCourseProgress(enrollment.rows[0].id);
    await refreshEnrollmentCertificationEligibility(enrollment.rows[0].id);
    await maybeAutoIssueCertificate(enrollment.rows[0].id);
  }
}

export async function getLessonExperience(
  userId: string,
  turmaId: string,
  lessonId: string
) {
  const context = await assertLessonAccess(userId, turmaId, lessonId);
  await recordLessonOpened(userId, turmaId, lessonId);
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        e.id,
        c.nome AS curso,
        t.nome AS turma,
        to_char(e.data, 'DD/MM/YYYY') AS data,
        to_char(e.horario_inicio, 'HH24:MI') AS horario_inicio,
        to_char(e.horario_fim, 'HH24:MI') AS horario_fim,
        e.modalidade,
        e.local,
        e.link_online,
        e.status,
        aa.quantidade_acessos,
        aa.concluida,
        to_char(aa.primeiro_acesso_em, 'DD/MM/YYYY HH24:MI') AS primeiro_acesso,
        to_char(aa.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso
      FROM encontros e
      INNER JOIN turmas t ON t.id = e.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN acessos_aulas aa ON aa.aula_id = e.id AND aa.usuario_id = $3
      WHERE e.id = $1 AND e.turma_id = $2
      LIMIT 1
    `,
    [lessonId, turmaId, userId]
  );
  const materials = await db.query(
    `
      SELECT id, titulo, descricao, tipo, url, to_char(publicado_em, 'DD/MM/YYYY') AS publicado_em
      FROM materiais
      WHERE aula_id = $1
        AND turma_id = $2
        AND status_publicacao = 'publicado'
        AND excluido_em IS NULL
        AND visibilidade IN ('publico', 'inscritos')
      ORDER BY ordem ASC, publicado_em DESC, titulo ASC
    `,
    [lessonId, turmaId]
  );

  return {
    ...result.rows[0],
    inscricaoId: context.inscricaoId,
    turmaId,
    cursoId: context.cursoId,
    materiais: materials.rows
  };
}

export async function listEngagement(
  user: CurrentUser,
  filters: EngagementFilters
): Promise<{
  rows: EngagementSummary[];
  metrics: EngagementMetrics;
  options: EngagementOptions;
}> {
  const scope = getProgressScope(user);
  const where = [...scope.where];
  const values = [...scope.values];

  if (filters.cursoId) {
    values.push(filters.cursoId);
    where.push(`c.id = $${values.length}`);
  }

  if (filters.turmaId) {
    values.push(filters.turmaId);
    where.push(`t.id = $${values.length}`);
  }

  if (filters.status && filters.status !== "todos") {
    values.push(filters.status);
    where.push(`COALESCE(pc.status, 'not_started') = $${values.length}`);
  }

  if (filters.aluno) {
    values.push(`%${filters.aluno.trim()}%`);
    where.push(`(u.nome ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();
  const [listResult, optionsResult] = await Promise.all([
    db.query(
      `
        SELECT
          i.id AS inscricao_id,
          u.id AS aluno_id,
          u.nome AS aluno,
          u.email,
          c.id AS curso_id,
          c.nome AS curso,
          t.id AS turma_id,
          t.nome AS turma,
          instrutor.nome AS instrutor,
          COALESCE(pc.status, 'not_started') AS status,
          COALESCE(pc.percentual_progresso, 0) AS progresso,
          COALESCE(pc.aulas_acessadas, 0) AS aulas_acessadas,
          COALESCE(pc.aulas_concluidas, 0) AS aulas_concluidas,
          COALESCE(pc.total_aulas, (
            SELECT COUNT(*) FROM encontros e WHERE e.turma_id = t.id
          )) AS total_aulas,
          to_char(pc.iniciado_em, 'DD/MM/YYYY HH24:MI') AS primeiro_acesso,
          to_char(pc.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso,
          CASE
            WHEN cert.id IS NOT NULL AND cert.status = 'valido' THEN 'disponivel'
            WHEN i.apto_certificado = true THEN 'pendente emissao'
            ELSE 'pendente'
          END AS certificado
        FROM inscricoes i
        INNER JOIN usuarios u ON u.id = i.usuario_id
        INNER JOIN turmas t ON t.id = i.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
        LEFT JOIN progresso_cursos pc ON pc.inscricao_id = i.id
        LEFT JOIN certificados cert ON cert.inscricao_id = i.id
        ${whereSql}
        ORDER BY t.data_inicio DESC, c.nome ASC, u.nome ASC
      `,
      values
    ),
    db.query(
      `
        SELECT DISTINCT c.id AS curso_id, c.nome AS curso, t.id AS turma_id, t.nome AS turma
        FROM turmas t
        INNER JOIN cursos c ON c.id = t.curso_id
        LEFT JOIN inscricoes i ON i.turma_id = t.id
        ${scope.where.length ? `WHERE ${scope.where.join(" AND ")}` : ""}
        ORDER BY c.nome ASC, t.nome ASC
      `,
      scope.values
    )
  ]);
  const rows = listResult.rows.map(mapEngagementSummary);
  const metrics = calculateMetrics(rows);

  return {
    rows,
    metrics,
    options: {
      cursos: uniqueBy(
        optionsResult.rows.map((item) => ({
          id: item.curso_id as string,
          nome: item.curso as string
        })),
        "id"
      ),
      turmas: optionsResult.rows.map((item) => ({
        id: item.turma_id as string,
        nome: item.turma as string,
        cursoId: item.curso_id as string
      }))
    }
  };
}

export async function getEngagementDetail(
  user: CurrentUser,
  enrollmentId: string
): Promise<EngagementDetail> {
  const scope = getProgressScope(user);
  const values = [...scope.values, enrollmentId];
  const where = [...scope.where, `i.id = $${values.length}`];
  const db = getDb();
  const summaryResult = await db.query(
    `
      SELECT
        i.id AS inscricao_id,
        i.status AS status_inscricao,
        u.id AS aluno_id,
        u.nome AS aluno,
        u.email,
        u.orgao_secretaria,
        u.cargo,
        c.id AS curso_id,
        c.nome AS curso,
        t.id AS turma_id,
        t.nome AS turma,
        instrutor.nome AS instrutor,
        COALESCE(pc.status, 'not_started') AS status,
        COALESCE(pc.percentual_progresso, 0) AS progresso,
        COALESCE(pc.aulas_acessadas, 0) AS aulas_acessadas,
        COALESCE(pc.aulas_concluidas, 0) AS aulas_concluidas,
        COALESCE(pc.total_aulas, (
          SELECT COUNT(*) FROM encontros e WHERE e.turma_id = t.id
        )) AS total_aulas,
        to_char(pc.iniciado_em, 'DD/MM/YYYY HH24:MI') AS primeiro_acesso,
        to_char(pc.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso,
        CASE
          WHEN cert.id IS NOT NULL AND cert.status = 'valido' THEN 'disponivel'
          WHEN i.apto_certificado = true THEN 'pendente emissao'
          ELSE 'pendente'
        END AS certificado
      FROM inscricoes i
      INNER JOIN usuarios u ON u.id = i.usuario_id
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
      LEFT JOIN progresso_cursos pc ON pc.inscricao_id = i.id
      LEFT JOIN certificados cert ON cert.inscricao_id = i.id
      WHERE ${where.join(" AND ")}
      LIMIT 1
    `,
    values
  );
  const summary = summaryResult.rows[0];

  if (!summary) {
    throw new ProgressAccessError("Acompanhamento não encontrado.", 404);
  }

  const [lessonResult, eventResult, forumResult] = await Promise.all([
    db.query(
      `
        SELECT
          e.id,
          to_char(e.data, 'DD/MM/YYYY') || ' - ' || e.modalidade AS titulo,
          to_char(e.data, 'DD/MM/YYYY') AS data,
          e.modalidade,
          aa.id IS NOT NULL AS acessada,
          COALESCE(aa.quantidade_acessos, 0) AS quantidade_acessos,
          to_char(aa.primeiro_acesso_em, 'DD/MM/YYYY HH24:MI') AS primeiro_acesso,
          to_char(aa.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso,
          COALESCE(aa.concluida, false) AS concluida,
          to_char(aa.concluido_em, 'DD/MM/YYYY HH24:MI') AS concluido_em
        FROM encontros e
        LEFT JOIN acessos_aulas aa
          ON aa.aula_id = e.id
         AND aa.usuario_id = $2
        WHERE e.turma_id = $1
        ORDER BY e.data ASC, e.horario_inicio ASC
      `,
      [summary.turma_id, summary.aluno_id]
    ),
    db.query(
      `
        SELECT
          ev.id,
          ev.tipo_evento,
          to_char(ev.criado_em, 'DD/MM/YYYY HH24:MI') AS criado_em,
          to_char(e.data, 'DD/MM/YYYY') || ' - ' || e.modalidade AS aula
        FROM eventos_aprendizagem ev
        LEFT JOIN encontros e ON e.id = ev.aula_id
        WHERE ev.usuario_id = $1
          AND ev.curso_id = $2
        ORDER BY ev.criado_em DESC
        LIMIT 30
      `,
      [summary.aluno_id, summary.curso_id]
    ),
    db.query(
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM topicos top
            INNER JOIN foruns f ON f.id = top.forum_id
            WHERE f.turma_id = $1 AND top.usuario_id = $2
          ) +
          (
            SELECT COUNT(*)
            FROM comentarios com
            INNER JOIN topicos top ON top.id = com.topico_id
            INNER JOIN foruns f ON f.id = top.forum_id
            WHERE f.turma_id = $1 AND com.usuario_id = $2
          ) AS total
      `,
      [summary.turma_id, summary.aluno_id]
    )
  ]);
  const mappedSummary = mapEngagementSummary(summary);
  const pendencias: string[] = [];

  if (mappedSummary.status !== "completed") {
    pendencias.push("Concluir todas as aulas da turma.");
  }

  if (mappedSummary.certificado !== "disponivel") {
    pendencias.push("Aguardar liberação ou emissão do certificado.");
  }

  return {
    summary: {
      ...mappedSummary,
      statusInscricao: summary.status_inscricao,
      orgaoSecretaria: summary.orgao_secretaria,
      cargo: summary.cargo
    },
    aulas: lessonResult.rows.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      data: item.data,
      modalidade: item.modalidade,
      acessada: Boolean(item.acessada),
      quantidadeAcessos: Number(item.quantidade_acessos),
      primeiroAcesso: item.primeiro_acesso,
      ultimoAcesso: item.ultimo_acesso,
      concluida: Boolean(item.concluida),
      concluidoEm: item.concluido_em
    })),
    eventos: eventResult.rows.map((item) => ({
      id: item.id,
      tipo: item.tipo_evento,
      aula: item.aula,
      criadoEm: item.criado_em
    })),
    forumPosts: Number(forumResult.rows[0]?.total ?? 0),
    pendenciasCertificacao: pendencias.length
      ? pendencias
      : ["Nenhuma pendência identificada."]
  };
}

async function getEnrollmentContext(
  userId: string,
  turmaId: string
): Promise<EnrollmentContext> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT i.id AS inscricao_id, i.usuario_id, t.curso_id, t.id AS turma_id
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      WHERE i.usuario_id = $1
        AND i.turma_id = $2
        AND i.status <> 'cancelado'
      LIMIT 1
    `,
    [userId, turmaId]
  );
  const item = result.rows[0];

  if (!item) {
    throw new ProgressAccessError("Inscrição ativa não encontrada.", 404);
  }

  return {
    inscricaoId: item.inscricao_id,
    usuarioId: item.usuario_id,
    cursoId: item.curso_id,
    turmaId: item.turma_id
  };
}

async function assertLessonAccess(
  userId: string,
  turmaId: string,
  lessonId: string
): Promise<EnrollmentContext> {
  const context = await getEnrollmentContext(userId, turmaId);
  const db = getDb();
  const lesson = await db.query(
    "SELECT id FROM encontros WHERE id = $1 AND turma_id = $2 LIMIT 1",
    [lessonId, turmaId]
  );

  if (!lesson.rows[0]) {
    throw new ProgressAccessError("Aula não encontrada para esta turma.", 404);
  }

  return context;
}

async function ensureCourseProgress(context: EnrollmentContext) {
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO progresso_cursos (
        id, usuario_id, curso_id, inscricao_id, status, total_aulas, atualizado_em
      )
      SELECT
        gen_random_uuid(),
        $1,
        $2,
        $3,
        'not_started',
        COUNT(e.id)::int,
        now()
      FROM turmas t
      LEFT JOIN encontros e ON e.turma_id = t.id
      WHERE t.id = $4
      ON CONFLICT (inscricao_id)
      DO UPDATE SET total_aulas = EXCLUDED.total_aulas,
                    atualizado_em = now()
      RETURNING *
    `,
    [context.usuarioId, context.cursoId, context.inscricaoId, context.turmaId]
  );

  return result.rows[0];
}

async function recomputeCourseProgress(enrollmentId: string) {
  const db = getDb();
  await db.query(
    `
      WITH base AS (
        SELECT
          i.id AS inscricao_id,
          i.usuario_id,
          t.id AS turma_id,
          t.curso_id,
          COUNT(DISTINCT e.id)::int AS total_aulas,
          COUNT(DISTINCT aa.aula_id) FILTER (WHERE aa.id IS NOT NULL)::int AS aulas_acessadas,
          COUNT(DISTINCT aa.aula_id) FILTER (WHERE aa.concluida = true)::int AS aulas_concluidas
        FROM inscricoes i
        INNER JOIN turmas t ON t.id = i.turma_id
        LEFT JOIN encontros e ON e.turma_id = t.id
        LEFT JOIN acessos_aulas aa
          ON aa.aula_id = e.id
         AND aa.usuario_id = i.usuario_id
        WHERE i.id = $1
        GROUP BY i.id, i.usuario_id, t.id, t.curso_id
      )
      UPDATE progresso_cursos pc
      SET total_aulas = base.total_aulas,
          aulas_acessadas = base.aulas_acessadas,
          aulas_concluidas = base.aulas_concluidas,
          percentual_progresso = CASE
            WHEN base.total_aulas = 0 THEN 0
            ELSE ROUND((base.aulas_concluidas::numeric / base.total_aulas::numeric) * 100, 2)
          END,
          status = CASE
            WHEN base.total_aulas > 0 AND base.aulas_concluidas >= base.total_aulas THEN 'completed'
            WHEN base.aulas_concluidas > 0 OR base.aulas_acessadas > 1 THEN 'in_progress'
            WHEN pc.iniciado_em IS NOT NULL OR base.aulas_acessadas > 0 THEN 'started'
            ELSE 'not_started'
          END,
          concluido_em = CASE
            WHEN base.total_aulas > 0 AND base.aulas_concluidas >= base.total_aulas
              THEN COALESCE(pc.concluido_em, now())
            ELSE NULL
          END,
          ultimo_acesso_em = GREATEST(
            COALESCE(pc.ultimo_acesso_em, pc.criado_em),
            COALESCE((SELECT MAX(ultimo_acesso_em) FROM acessos_aulas WHERE usuario_id = base.usuario_id AND curso_id = base.curso_id), pc.criado_em)
          ),
          atualizado_em = now()
      FROM base
      WHERE pc.inscricao_id = base.inscricao_id
    `,
    [enrollmentId]
  );
}

async function requestCertificateApprovalIfCompleted(context: EnrollmentContext) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT pc.status
      FROM progresso_cursos pc
      LEFT JOIN eventos_aprendizagem ev
        ON ev.usuario_id = pc.usuario_id
       AND ev.curso_id = pc.curso_id
       AND ev.tipo_evento = 'certificate_requested'
      WHERE pc.inscricao_id = $1
        AND pc.status = 'completed'
        AND ev.id IS NULL
      LIMIT 1
    `,
    [context.inscricaoId]
  );

  if (!result.rows[0]) {
    return;
  }

  await insertLearningEvent({
    userId: context.usuarioId,
    courseId: context.cursoId,
    type: "certificate_requested",
    metadata: {
      turmaId: context.turmaId,
      inscricaoId: context.inscricaoId
    }
  });
}

async function insertLearningEvent(input: {
  userId: string;
  courseId: string;
  lessonId?: string;
  type: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.query(
    `
      INSERT INTO eventos_aprendizagem (
        id, usuario_id, curso_id, aula_id, tipo_evento, metadata
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb)
    `,
    [
      input.userId,
      input.courseId,
      input.lessonId ?? null,
      input.type,
      JSON.stringify(input.metadata ?? {})
    ]
  );
}

function getProgressScope(user: CurrentUser) {
  if (hasPermission(user, "progress.view_all")) {
    return { where: ["i.status <> 'cancelado'"], values: [] as string[] };
  }

  if (hasPermission(user, "progress.view_courses_managed")) {
    return {
      where: [
        "i.status <> 'cancelado'",
        "EXISTS (SELECT 1 FROM vinculos_instrutoria vi WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo')"
      ],
      values: [user.id]
    };
  }

  if (hasPermission(user, "progress.view_own")) {
    return {
      where: ["i.status <> 'cancelado'", "i.usuario_id = $1"],
      values: [user.id]
    };
  }

  throw new ProgressAccessError("Usuário sem permissão para ver progresso.");
}

function mapEngagementSummary(item: Record<string, unknown>): EngagementSummary {
  return {
    inscricaoId: item.inscricao_id as string,
    alunoId: item.aluno_id as string,
    aluno: item.aluno as string,
    email: item.email as string,
    cursoId: item.curso_id as string,
    curso: item.curso as string,
    turmaId: item.turma_id as string,
    turma: item.turma as string,
    instrutor: item.instrutor as string | null,
    status: item.status as LearningStatus,
    progresso: String(item.progresso ?? "0"),
    aulasAcessadas: Number(item.aulas_acessadas ?? 0),
    aulasConcluidas: Number(item.aulas_concluidas ?? 0),
    totalAulas: Number(item.total_aulas ?? 0),
    primeiroAcesso: item.primeiro_acesso as string | null,
    ultimoAcesso: item.ultimo_acesso as string | null,
    certificado: item.certificado as string
  };
}

function calculateMetrics(rows: EngagementSummary[]): EngagementMetrics {
  const totalAlunos = rows.length;
  const totalProgress = rows.reduce((sum, item) => sum + Number(item.progresso), 0);

  return {
    totalAlunos,
    naoIniciados: rows.filter((item) => item.status === "not_started").length,
    emAndamento: rows.filter((item) =>
      ["started", "in_progress"].includes(item.status)
    ).length,
    concluidos: rows.filter((item) => item.status === "completed").length,
    mediaProgresso: totalAlunos ? Math.round(totalProgress / totalAlunos) : 0,
    semAcesso7Dias: rows.filter(
      (item) =>
        !item.ultimoAcesso ||
        parseBrazilianDateTime(item.ultimoAcesso).getTime() <
          Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length
  };
}

function parseBrazilianDateTime(value: string) {
  const [date, time = "00:00"] = value.split(" ");
  const [day, month, year] = date.split("/").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function uniqueBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    if (seen.has(item[key])) {
      return false;
    }
    seen.add(item[key]);
    return true;
  });
}
