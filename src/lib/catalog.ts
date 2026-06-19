import { getDb } from "@/lib/db";
import { createManagedEnrollment } from "@/lib/enrollments";

export type CatalogClass = {
  id: string;
  cursoId: string;
  curso: string;
  turma: string;
  descricao: string | null;
  tema: string | null;
  modalidade: string;
  cargaHoraria: string;
  dataInicio: string;
  vagas: number;
  inscritos: number;
  vagasDisponiveis: number;
  status: string;
  inscrito: boolean;
  instrutor: string | null;
  instrutorLattesUrl: string | null;
};

export type CatalogClassDetails = CatalogClass & {
  objetivos: string | null;
  ementa: string;
  publicoAlvo: string | null;
  cargaHoraria: string;
  local: string | null;
  linkOnline: string | null;
  criterioFrequenciaMinima: string;
  encontros: {
    id: string;
    data: string;
    horarioInicio: string;
    horarioFim: string;
    modalidade: string;
    local: string | null;
    linkOnline: string | null;
    status: string;
  }[];
  materiais: {
    id: string;
    titulo: string;
    tipo: string;
    url: string | null;
  }[];
};

export async function listCatalogClasses(userId: string): Promise<CatalogClass[]> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        t.id,
        c.id AS curso_id,
        c.nome AS curso,
        t.nome AS turma,
        c.descricao,
        c.tema,
        c.carga_horaria,
        t.modalidade,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        t.vagas,
        t.status,
        instrutor.nome AS instrutor,
        instrutor.lattes_url AS instrutor_lattes_url,
        COUNT(active_i.id)::int AS inscritos,
        EXISTS (
          SELECT 1
          FROM inscricoes my_i
          WHERE my_i.turma_id = t.id
            AND my_i.usuario_id = $1
            AND my_i.status <> 'cancelado'
        ) AS inscrito
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
      LEFT JOIN inscricoes active_i
        ON active_i.turma_id = t.id
       AND active_i.status <> 'cancelado'
      WHERE t.status = 'publicada'
        AND c.status = 'publicado'
      GROUP BY t.id, c.id, instrutor.id
      ORDER BY t.data_inicio ASC, c.nome ASC
    `,
    [userId]
  );

  return result.rows.map((item) => {
    const vagas = Number(item.vagas);
    const inscritos = Number(item.inscritos);

    return {
      id: item.id,
      cursoId: item.curso_id,
      curso: item.curso,
      turma: item.turma,
      descricao: item.descricao,
      tema: item.tema,
      modalidade: item.modalidade,
      cargaHoraria: String(item.carga_horaria),
      dataInicio: item.data_inicio,
      vagas,
      inscritos,
      vagasDisponiveis: Math.max(vagas - inscritos, 0),
      status: item.status,
      inscrito: Boolean(item.inscrito),
      instrutor: item.instrutor,
      instrutorLattesUrl: item.instrutor_lattes_url
    };
  });
}

export async function getCatalogClassDetails(
  userId: string,
  classId: string
): Promise<CatalogClassDetails | null> {
  const db = getDb();
  const classResult = await db.query(
    `
      SELECT
        t.id,
        c.id AS curso_id,
        c.nome AS curso,
        t.nome AS turma,
        c.descricao,
        c.objetivos,
        c.ementa,
        c.publico_alvo,
        c.tema,
        c.carga_horaria,
        t.modalidade,
        t.local,
        t.link_online,
        t.criterio_frequencia_minima,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        t.vagas,
        t.status,
        instrutor.nome AS instrutor,
        instrutor.lattes_url AS instrutor_lattes_url,
        COUNT(active_i.id)::int AS inscritos,
        EXISTS (
          SELECT 1
          FROM inscricoes my_i
          WHERE my_i.turma_id = t.id
            AND my_i.usuario_id = $1
            AND my_i.status <> 'cancelado'
        ) AS inscrito
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
      LEFT JOIN inscricoes active_i
        ON active_i.turma_id = t.id
       AND active_i.status <> 'cancelado'
      WHERE t.id = $2
        AND t.status = 'publicada'
        AND c.status = 'publicado'
      GROUP BY t.id, c.id, instrutor.id
      LIMIT 1
    `,
    [userId, classId]
  );
  const item = classResult.rows[0];

  if (!item) {
    return null;
  }

  const inscrito = Boolean(item.inscrito);
  const [meetingResult, materialResult] = await Promise.all([
    db.query(
      `
        SELECT
          id,
          to_char(data, 'DD/MM/YYYY') AS data,
          to_char(horario_inicio, 'HH24:MI') AS horario_inicio,
          to_char(horario_fim, 'HH24:MI') AS horario_fim,
          modalidade,
          local,
          CASE WHEN $2 = true THEN link_online ELSE NULL END AS link_online,
          status
        FROM encontros
        WHERE turma_id = $1
        ORDER BY data ASC, horario_inicio ASC
      `,
      [classId, inscrito]
    ),
    db.query(
      `
        SELECT id, titulo, tipo, url
        FROM materiais
        WHERE status_publicacao = 'publicado'
          AND excluido_em IS NULL
          AND (
            visibilidade = 'publico'
            OR ($3 = true AND visibilidade = 'inscritos')
          )
          AND (
            turma_id = $1
            OR curso_id = $2
          )
        ORDER BY publicado_em DESC, titulo ASC
      `,
      [classId, item.curso_id, inscrito]
    )
  ]);

  const vagas = Number(item.vagas);
  const inscritos = Number(item.inscritos);

  return {
    id: item.id,
    cursoId: item.curso_id,
    curso: item.curso,
    turma: item.turma,
    descricao: item.descricao,
    objetivos: item.objetivos,
    ementa: item.ementa,
    publicoAlvo: item.publico_alvo,
    tema: item.tema,
    cargaHoraria: String(item.carga_horaria),
    modalidade: item.modalidade,
    local: item.local,
    linkOnline: item.link_online,
    criterioFrequenciaMinima: String(item.criterio_frequencia_minima),
    dataInicio: item.data_inicio,
    vagas,
    inscritos,
    vagasDisponiveis: Math.max(vagas - inscritos, 0),
    status: item.status,
    inscrito,
    instrutor: item.instrutor,
    instrutorLattesUrl: item.instrutor_lattes_url,
    encontros: meetingResult.rows.map((meeting) => ({
      id: meeting.id,
      data: meeting.data,
      horarioInicio: meeting.horario_inicio,
      horarioFim: meeting.horario_fim,
      modalidade: meeting.modalidade,
      local: meeting.local,
      linkOnline: meeting.link_online,
      status: meeting.status
    })),
    materiais: materialResult.rows.map((material) => ({
      id: material.id,
      titulo: material.titulo,
      tipo: material.tipo,
      url: material.url
    }))
  };
}

export async function enrollCurrentUserInClass(userId: string, classId: string) {
  const enrollment = await createManagedEnrollment({
    usuarioId: userId,
    turmaId: classId,
    origem: "autoinscricao"
  });

  return { id: enrollment.id as string };
}
