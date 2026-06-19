import { getDb } from "@/lib/db";
import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export type ForumClassSummary = {
  id: string;
  nome: string;
  curso: string;
  status: string;
  inscricoesAtivas: number;
  topicos: number;
};

export type ForumTopic = {
  id: string;
  titulo: string;
  conteudo: string;
  status: string;
  autor: string;
  criadoEm: string;
  comentarios: ForumComment[];
};

export type ForumComment = {
  id: string;
  conteudo: string;
  status: string;
  autor: string;
  criadoEm: string;
};

export type ForumDetails = {
  turma: ForumClassSummary;
  topicos: ForumTopic[];
};

export class ForumAccessError extends Error {
  code: string;
  status: number;

  constructor(
    code: string,
    message = "Usuário sem acesso ao fórum desta turma.",
    status = 403
  ) {
    super(message);
    this.name = "ForumAccessError";
    this.code = code;
    this.status = status;
  }
}

export class ForumMutationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ForumMutationError";
    this.code = code;
    this.status = status;
  }
}

export const forumModeratorRoles = [ROLES.admin, ROLES.gestor, ROLES.moderador];
const forumBroadAccessRoles = [ROLES.admin, ROLES.gestor, ROLES.moderador];

export function canModerateForum(user: CurrentUser) {
  return hasAnyRole(user, forumModeratorRoles) || hasPermission(user, "forums.moderate");
}

function canSeeAllForumClasses(user: CurrentUser) {
  return hasAnyRole(user, forumBroadAccessRoles) || hasPermission(user, "forums.moderate");
}

export async function listForumClasses(
  user: CurrentUser
): Promise<ForumClassSummary[]> {
  const db = getDb();

  const result = canSeeAllForumClasses(user)
    ? await db.query(`
        SELECT
          t.id,
          t.nome,
          t.status,
          c.nome AS curso,
          COUNT(DISTINCT i.id) FILTER (WHERE i.status <> 'cancelado') AS inscricoes_ativas,
          COUNT(DISTINCT top.id) FILTER (WHERE top.status = 'publicado') AS topicos
        FROM turmas t
        INNER JOIN cursos c ON c.id = t.curso_id
        LEFT JOIN inscricoes i ON i.turma_id = t.id
        LEFT JOIN foruns f ON f.turma_id = t.id
        LEFT JOIN topicos top ON top.forum_id = f.id
        WHERE t.status = 'publicada'
          AND c.status = 'publicado'
        GROUP BY t.id, c.nome
        ORDER BY t.data_inicio DESC, t.nome ASC
      `)
    : await db.query(
        `
          SELECT
            t.id,
            t.nome,
            t.status,
            c.nome AS curso,
            COUNT(DISTINCT i2.id) FILTER (WHERE i2.status <> 'cancelado') AS inscricoes_ativas,
            COUNT(DISTINCT top.id) FILTER (WHERE top.status = 'publicado') AS topicos
          FROM turmas t
          INNER JOIN cursos c ON c.id = t.curso_id
          LEFT JOIN inscricoes i
            ON i.turma_id = t.id
           AND i.usuario_id = $1
           AND i.status <> 'cancelado'
          LEFT JOIN inscricoes i2 ON i2.turma_id = t.id
          LEFT JOIN foruns f ON f.turma_id = t.id
          LEFT JOIN topicos top ON top.forum_id = f.id
          WHERE t.status = 'publicada'
            AND c.status = 'publicado'
            AND (
              i.id IS NOT NULL
              OR EXISTS (
                SELECT 1 FROM vinculos_instrutoria vi
                WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
              )
            )
          GROUP BY t.id, c.nome
          ORDER BY t.data_inicio DESC, t.nome ASC
        `,
        [user.id]
      );

  return result.rows.map(mapClassSummary);
}

export async function getForumDetails(
  user: CurrentUser,
  turmaId: string
): Promise<ForumDetails> {
  await assertForumAccess(user, turmaId);
  const db = getDb();
  const [classResult, topicResult] = await Promise.all([
    db.query(
      `
        SELECT
          t.id,
          t.nome,
          t.status,
          c.nome AS curso,
          COUNT(DISTINCT i.id) FILTER (WHERE i.status <> 'cancelado') AS inscricoes_ativas,
          COUNT(DISTINCT top.id) FILTER (WHERE top.status = 'publicado') AS topicos
        FROM turmas t
        INNER JOIN cursos c ON c.id = t.curso_id
        LEFT JOIN inscricoes i ON i.turma_id = t.id
        LEFT JOIN foruns f ON f.turma_id = t.id
        LEFT JOIN topicos top ON top.forum_id = f.id
        WHERE t.id = $1
        GROUP BY t.id, c.nome
      `,
      [turmaId]
    ),
    db.query(
      `
        SELECT
          top.id AS topico_id,
          top.titulo,
          top.conteudo AS topico_conteudo,
          top.status AS topico_status,
          top.criado_em AS topico_criado_em,
          autor_topico.nome AS topico_autor,
          com.id AS comentario_id,
          com.conteudo AS comentario_conteudo,
          com.status AS comentario_status,
          com.criado_em AS comentario_criado_em,
          autor_comentario.nome AS comentario_autor
        FROM topicos top
        INNER JOIN foruns f ON f.id = top.forum_id
        INNER JOIN usuarios autor_topico ON autor_topico.id = top.usuario_id
        LEFT JOIN comentarios com ON com.topico_id = top.id
        LEFT JOIN usuarios autor_comentario ON autor_comentario.id = com.usuario_id
        WHERE f.turma_id = $1
          AND (
            top.status = 'publicado'
            OR $2 = true
          )
          AND (
            com.id IS NULL
            OR com.status = 'publicado'
            OR $2 = true
          )
        ORDER BY top.criado_em DESC, com.criado_em ASC
      `,
      [turmaId, canModerateForum(user)]
    )
  ]);

  const turma = classResult.rows[0];
  if (!turma) {
    throw new ForumAccessError("CLASS_NOT_FOUND", "Turma não encontrada.", 404);
  }

  return {
    turma: mapClassSummary(turma),
    topicos: mapTopics(topicResult.rows)
  };
}

export async function createForumTopic(input: {
  user: CurrentUser;
  turmaId: string;
  titulo: string;
  conteudo: string;
}) {
  await assertForumAccess(input.user, input.turmaId);
  const db = getDb();

  const forumResult = await db.query(
    `
      INSERT INTO foruns (id, turma_id, titulo)
      VALUES (gen_random_uuid(), $1, 'Fórum da turma')
      ON CONFLICT (turma_id)
      DO UPDATE SET titulo = foruns.titulo
      RETURNING id
    `,
    [input.turmaId]
  );

  const result = await db.query(
    `
      INSERT INTO topicos (id, forum_id, usuario_id, titulo, conteudo, atualizado_em)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, now())
      RETURNING id, titulo
    `,
    [forumResult.rows[0].id, input.user.id, input.titulo, input.conteudo]
  );

  return result.rows[0] as { id: string; titulo: string };
}

export async function createForumComment(input: {
  user: CurrentUser;
  topicoId: string;
  conteudo: string;
}) {
  const topic = await getTopicContext(input.topicoId);
  if (!topic) {
    throw new ForumMutationError("TOPIC_NOT_FOUND", "Tópico não encontrado.", 404);
  }

  if (topic.topico_status !== "publicado") {
    throw new ForumMutationError(
      "TOPIC_NOT_AVAILABLE",
      "Não é possível comentar em tópico oculto.",
      409
    );
  }

  await assertForumAccess(input.user, topic.turma_id);
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO comentarios (id, topico_id, usuario_id, conteudo, atualizado_em)
      VALUES (gen_random_uuid(), $1, $2, $3, now())
      RETURNING id
    `,
    [input.topicoId, input.user.id, input.conteudo]
  );

  return result.rows[0] as { id: string };
}

export async function updateForumContentStatus(input: {
  user: CurrentUser;
  tipo: "topico" | "comentario";
  id: string;
  status: "publicado" | "oculto";
}) {
  if (!canModerateForum(input.user)) {
    throw new ForumAccessError("FORUM_MODERATION_FORBIDDEN");
  }

  const db = getDb();
  const result =
    input.tipo === "topico"
      ? await db.query(
          `
            UPDATE topicos
            SET status = $2,
                atualizado_em = now()
            WHERE id = $1
            RETURNING id
          `,
          [input.id, input.status]
        )
      : await db.query(
          `
            UPDATE comentarios
            SET status = $2,
                atualizado_em = now()
            WHERE id = $1
            RETURNING id
          `,
          [input.id, input.status]
        );

  if (!result.rows[0]) {
    throw new ForumMutationError("CONTENT_NOT_FOUND", "Conteúdo não encontrado.", 404);
  }

  return result.rows[0] as { id: string };
}

async function assertForumAccess(user: CurrentUser, turmaId: string) {
  if (canSeeAllForumClasses(user)) {
    await assertPublishedClass(turmaId);
    return;
  }

  const db = getDb();
  const result = await db.query(
    `
      SELECT t.id
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN inscricoes i
        ON i.turma_id = t.id
       AND i.usuario_id = $1
       AND i.status <> 'cancelado'
      WHERE t.id = $2
        AND t.status = 'publicada'
        AND c.status = 'publicado'
        AND (
          i.id IS NOT NULL
          OR EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
          )
        )
      LIMIT 1
    `,
    [user.id, turmaId]
  );

  if (!result.rows[0]) {
    throw new ForumAccessError("FORUM_FORBIDDEN");
  }
}

async function assertPublishedClass(turmaId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT t.id
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE t.id = $1
        AND t.status = 'publicada'
        AND c.status = 'publicado'
      LIMIT 1
    `,
    [turmaId]
  );

  if (!result.rows[0]) {
    throw new ForumAccessError("CLASS_NOT_AVAILABLE", "Turma indisponível.", 404);
  }
}

async function getTopicContext(topicoId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT top.id, top.status AS topico_status, f.turma_id
      FROM topicos top
      INNER JOIN foruns f ON f.id = top.forum_id
      WHERE top.id = $1
      LIMIT 1
    `,
    [topicoId]
  );

  return result.rows[0] as
    | { id: string; topico_status: string; turma_id: string }
    | undefined;
}

function mapClassSummary(item: Record<string, unknown>): ForumClassSummary {
  return {
    id: String(item.id),
    nome: String(item.nome),
    curso: String(item.curso),
    status: String(item.status),
    inscricoesAtivas: Number(item.inscricoes_ativas ?? 0),
    topicos: Number(item.topicos ?? 0)
  };
}

function mapTopics(rows: Record<string, unknown>[]): ForumTopic[] {
  const topics = new Map<string, ForumTopic>();

  for (const row of rows) {
    const topicId = String(row.topico_id);
    if (!topics.has(topicId)) {
      topics.set(topicId, {
        id: topicId,
        titulo: String(row.titulo),
        conteudo: String(row.topico_conteudo),
        status: String(row.topico_status),
        autor: String(row.topico_autor),
        criadoEm: formatDate(row.topico_criado_em),
        comentarios: []
      });
    }

    if (row.comentario_id) {
      topics.get(topicId)?.comentarios.push({
        id: String(row.comentario_id),
        conteudo: String(row.comentario_conteudo),
        status: String(row.comentario_status),
        autor: String(row.comentario_autor),
        criadoEm: formatDate(row.comentario_criado_em)
      });
    }
  }

  return Array.from(topics.values());
}

function formatDate(value: unknown) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(String(value)));
}
