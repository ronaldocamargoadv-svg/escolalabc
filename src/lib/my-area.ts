import { getDb } from "@/lib/db";

export type MyEnrollment = {
  id: string;
  turmaId: string;
  curso: string;
  turma: string;
  status: string;
  modalidade: string;
  dataInicio: string;
  percentualFrequencia: string;
  criterioFrequenciaMinima: string;
  progressoAprendizagem: string;
  statusAprendizagem: string;
  ultimoAcesso: string | null;
  aulasConcluidas: number;
  totalAulas: number;
  aptoCertificado: boolean;
};

export type MyMaterial = {
  id: string;
  turmaId: string;
  titulo: string;
  tipo: string;
  url: string | null;
  visibilidade: string;
  curso: string | null;
  turma: string | null;
  publicadoEm: string;
  descricao?: string | null;
  aula?: string | null;
};

export type MyCertificate = {
  id: string;
  codigoValidacao: string;
  curso: string;
  turma: string;
  status: string;
  dataEmissao: string;
};

export type MyMeeting = {
  id: string;
  curso: string;
  turma: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  modalidade: string;
  presenca: string | null;
};

export type MyClassStartDetails = {
  inscricaoId: string;
  turmaId: string;
  cursoId: string;
  curso: string;
  turma: string;
  descricao: string | null;
  objetivos: string | null;
  ementa: string;
  publicoAlvo: string | null;
  tema: string | null;
  modalidade: string;
  dataInicio: string;
  dataFim: string | null;
  cargaHoraria: string;
  criterioFrequenciaMinima: string;
  percentualFrequencia: string;
  progressoAprendizagem: string;
  statusAprendizagem: string;
  ultimoAcesso: string | null;
  aulasConcluidas: number;
  totalAulas: number;
  aptoCertificado: boolean;
  statusInscricao: string;
  statusTurma: string;
  local: string | null;
  linkOnline: string | null;
  instrutor: string | null;
  instrutorLattesUrl: string | null;
  encontros: (MyMeeting & {
    local: string | null;
    linkOnline: string | null;
    status: string;
    acessos: number;
    concluida: boolean;
    primeiroAcesso: string | null;
    ultimoAcesso: string | null;
  })[];
  materiais: MyMaterial[];
};

export async function getMyEnrollments(userId: string): Promise<MyEnrollment[]> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        i.id,
        t.id AS turma_id,
        c.nome AS curso,
        t.nome AS turma,
        i.status,
        t.modalidade,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        i.percentual_frequencia,
        t.criterio_frequencia_minima,
        COALESCE(pc.percentual_progresso, 0) AS progresso_aprendizagem,
        COALESCE(pc.status, 'not_started') AS status_aprendizagem,
        to_char(pc.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso,
        COALESCE(pc.aulas_concluidas, 0) AS aulas_concluidas,
        COALESCE(pc.total_aulas, (
          SELECT COUNT(*) FROM encontros e WHERE e.turma_id = t.id
        )) AS total_aulas,
        i.apto_certificado
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN progresso_cursos pc ON pc.inscricao_id = i.id
      WHERE i.usuario_id = $1
      ORDER BY t.data_inicio DESC, i.data_inscricao DESC
    `,
    [userId]
  );

  return result.rows.map((item) => ({
    id: item.id,
    turmaId: item.turma_id,
    curso: item.curso,
    turma: item.turma,
    status: item.status,
    modalidade: item.modalidade,
    dataInicio: item.data_inicio,
    percentualFrequencia: String(item.percentual_frequencia),
    criterioFrequenciaMinima: String(item.criterio_frequencia_minima),
    progressoAprendizagem: String(item.progresso_aprendizagem),
    statusAprendizagem: item.status_aprendizagem,
    ultimoAcesso: item.ultimo_acesso,
    aulasConcluidas: Number(item.aulas_concluidas),
    totalAulas: Number(item.total_aulas),
    aptoCertificado: Boolean(item.apto_certificado)
  }));
}

export async function getMyMaterials(userId: string): Promise<MyMaterial[]> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT DISTINCT
        m.id,
        COALESCE(m.turma_id, i.turma_id) AS turma_id,
        m.titulo,
        m.descricao,
        m.tipo,
        m.url,
        m.visibilidade,
        c.nome AS curso,
        t.nome AS turma,
        CASE WHEN e.id IS NOT NULL
          THEN CONCAT('Aula de ', to_char(e.data, 'DD/MM/YYYY'))
          ELSE NULL END AS aula,
        to_char(m.publicado_em, 'DD/MM/YYYY') AS publicado_em
      FROM materiais m
      LEFT JOIN cursos c ON c.id = m.curso_id
      LEFT JOIN turmas t ON t.id = m.turma_id
      LEFT JOIN encontros e ON e.id = m.aula_id
      INNER JOIN inscricoes i
        ON i.usuario_id = $1
       AND i.status <> 'cancelado'
      INNER JOIN turmas it ON it.id = i.turma_id
      WHERE
        m.status_publicacao = 'publicado'
        AND m.excluido_em IS NULL
        AND
        m.visibilidade IN ('publico', 'inscritos')
        AND (
          m.turma_id = i.turma_id
          OR m.curso_id = it.curso_id
        )
      ORDER BY publicado_em DESC, m.titulo ASC
    `,
    [userId]
  );

  return result.rows.map((item) => ({
    id: item.id,
    turmaId: item.turma_id,
    titulo: item.titulo,
    tipo: item.tipo,
    url: item.url,
    visibilidade: item.visibilidade,
    curso: item.curso,
    turma: item.turma,
    publicadoEm: item.publicado_em,
    descricao: item.descricao,
    aula: item.aula
  }));
}

export async function getMyCertificates(userId: string): Promise<MyCertificate[]> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        cert.id,
        cert.codigo_validacao,
        c.nome AS curso,
        t.nome AS turma,
        cert.status,
        to_char(cert.data_emissao, 'DD/MM/YYYY') AS data_emissao
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE i.usuario_id = $1
      ORDER BY cert.data_emissao DESC
    `,
    [userId]
  );

  return result.rows.map((item) => ({
    id: item.id,
    codigoValidacao: item.codigo_validacao,
    curso: item.curso,
    turma: item.turma,
    status: item.status,
    dataEmissao: item.data_emissao
  }));
}

export async function getMyMeetings(userId: string): Promise<MyMeeting[]> {
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
        p.status AS presenca
      FROM encontros e
      INNER JOIN turmas t ON t.id = e.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      INNER JOIN inscricoes i
        ON i.turma_id = t.id
       AND i.usuario_id = $1
       AND i.status <> 'cancelado'
      LEFT JOIN presencas p ON p.encontro_id = e.id AND p.inscricao_id = i.id
      ORDER BY e.data DESC, e.horario_inicio DESC
      LIMIT 10
    `,
    [userId]
  );

  return result.rows.map((item) => ({
    id: item.id,
    curso: item.curso,
    turma: item.turma,
    data: item.data,
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    modalidade: item.modalidade,
    presenca: item.presenca
  }));
}

export async function getMyClassStartDetails(
  userId: string,
  classId: string
): Promise<MyClassStartDetails | null> {
  const db = getDb();
  const enrollmentResult = await db.query(
    `
      SELECT
        i.id AS inscricao_id,
        i.status AS status_inscricao,
        i.percentual_frequencia,
        i.apto_certificado,
        COALESCE(pc.percentual_progresso, 0) AS progresso_aprendizagem,
        COALESCE(pc.status, 'not_started') AS status_aprendizagem,
        to_char(pc.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso,
        COALESCE(pc.aulas_concluidas, 0) AS aulas_concluidas,
        COALESCE(pc.total_aulas, (
          SELECT COUNT(*) FROM encontros e WHERE e.turma_id = t.id
        )) AS total_aulas,
        t.id AS turma_id,
        t.nome AS turma,
        t.status AS status_turma,
        t.modalidade,
        t.local,
        t.link_online,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        to_char(t.data_fim, 'DD/MM/YYYY') AS data_fim,
        t.criterio_frequencia_minima,
        c.id AS curso_id,
        c.nome AS curso,
        c.descricao,
        c.objetivos,
        c.ementa,
        c.publico_alvo,
        c.tema,
        c.carga_horaria,
        instrutor.nome AS instrutor,
        instrutor.lattes_url AS instrutor_lattes_url
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN usuarios instrutor ON instrutor.id = t.instrutor_id
      LEFT JOIN progresso_cursos pc ON pc.inscricao_id = i.id
      WHERE i.usuario_id = $1
        AND i.turma_id = $2
        AND i.status <> 'cancelado'
      LIMIT 1
    `,
    [userId, classId]
  );
  const item = enrollmentResult.rows[0];

  if (!item) {
    return null;
  }

  const [meetingResult, materialResult] = await Promise.all([
    db.query(
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
          p.status AS presenca,
          COALESCE(aa.quantidade_acessos, 0) AS acessos,
          COALESCE(aa.concluida, false) AS concluida,
          to_char(aa.primeiro_acesso_em, 'DD/MM/YYYY HH24:MI') AS primeiro_acesso,
          to_char(aa.ultimo_acesso_em, 'DD/MM/YYYY HH24:MI') AS ultimo_acesso
        FROM encontros e
        INNER JOIN turmas t ON t.id = e.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        LEFT JOIN presencas p
          ON p.encontro_id = e.id
         AND p.inscricao_id = $2
        LEFT JOIN acessos_aulas aa
          ON aa.aula_id = e.id
         AND aa.usuario_id = $3
        WHERE e.turma_id = $1
        ORDER BY e.data ASC, e.horario_inicio ASC
      `,
      [classId, item.inscricao_id, userId]
    ),
    db.query(
      `
        SELECT DISTINCT
          m.id,
          COALESCE(m.turma_id, $1::uuid) AS turma_id,
          m.titulo,
          m.descricao,
          m.tipo,
          m.url,
          m.visibilidade,
          c.nome AS curso,
          t.nome AS turma,
          CASE WHEN e.id IS NOT NULL
            THEN CONCAT('Aula de ', to_char(e.data, 'DD/MM/YYYY'))
            ELSE NULL END AS aula,
          to_char(m.publicado_em, 'DD/MM/YYYY') AS publicado_em
        FROM materiais m
        LEFT JOIN cursos c ON c.id = m.curso_id
        LEFT JOIN turmas t ON t.id = m.turma_id
        LEFT JOIN encontros e ON e.id = m.aula_id
        WHERE
          m.status_publicacao = 'publicado'
          AND m.excluido_em IS NULL
          AND
          m.visibilidade IN ('publico', 'inscritos')
          AND (
            m.turma_id = $1
            OR m.curso_id = $2
          )
        ORDER BY publicado_em DESC, m.titulo ASC
      `,
      [classId, item.curso_id]
    )
  ]);

  return {
    inscricaoId: item.inscricao_id,
    turmaId: item.turma_id,
    cursoId: item.curso_id,
    curso: item.curso,
    turma: item.turma,
    descricao: item.descricao,
    objetivos: item.objetivos,
    ementa: item.ementa,
    publicoAlvo: item.publico_alvo,
    tema: item.tema,
    modalidade: item.modalidade,
    dataInicio: item.data_inicio,
    dataFim: item.data_fim,
    cargaHoraria: String(item.carga_horaria),
    criterioFrequenciaMinima: String(item.criterio_frequencia_minima),
    percentualFrequencia: String(item.percentual_frequencia),
    progressoAprendizagem: String(item.progresso_aprendizagem),
    statusAprendizagem: item.status_aprendizagem,
    ultimoAcesso: item.ultimo_acesso,
    aulasConcluidas: Number(item.aulas_concluidas),
    totalAulas: Number(item.total_aulas),
    aptoCertificado: Boolean(item.apto_certificado),
    statusInscricao: item.status_inscricao,
    statusTurma: item.status_turma,
    local: item.local,
    linkOnline: item.link_online,
    instrutor: item.instrutor,
    instrutorLattesUrl: item.instrutor_lattes_url,
    encontros: meetingResult.rows.map((meeting) => ({
      id: meeting.id,
      curso: meeting.curso,
      turma: meeting.turma,
      data: meeting.data,
      horarioInicio: meeting.horario_inicio,
      horarioFim: meeting.horario_fim,
      modalidade: meeting.modalidade,
      local: meeting.local,
      linkOnline: meeting.link_online,
      status: meeting.status,
      presenca: meeting.presenca,
      acessos: Number(meeting.acessos),
      concluida: Boolean(meeting.concluida),
      primeiroAcesso: meeting.primeiro_acesso,
      ultimoAcesso: meeting.ultimo_acesso
    })),
    materiais: materialResult.rows.map((material) => ({
      id: material.id,
      turmaId: material.turma_id,
      titulo: material.titulo,
      tipo: material.tipo,
      url: material.url,
      visibilidade: material.visibilidade,
      curso: material.curso,
      turma: material.turma,
      publicadoEm: material.publicado_em,
      descricao: material.descricao,
      aula: material.aula
    }))
  };
}

export async function cancelMyEnrollment(userId: string, enrollmentId: string) {
  const db = getDb();
  const existing = await db.query(
    `
      SELECT
        i.id,
        i.status,
        t.nome AS turma,
        EXISTS (
          SELECT 1
          FROM certificados cert
          WHERE cert.inscricao_id = i.id
            AND cert.status = 'valido'
        ) AS has_valid_certificate
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      WHERE i.id = $1
        AND i.usuario_id = $2
      LIMIT 1
    `,
    [enrollmentId, userId]
  );
  const enrollment = existing.rows[0];

  if (!enrollment) {
    throw new Error("Inscrição não encontrada para este usuário.");
  }

  if (enrollment.has_valid_certificate) {
    throw new Error("Inscrição com certificado válido não pode ser cancelada.");
  }

  if (enrollment.status === "cancelado") {
    return {
      id: enrollment.id,
      turma: enrollment.turma,
      status: enrollment.status as string
    };
  }

  const result = await db.query(
    `
      UPDATE inscricoes
      SET status = 'cancelado',
          atualizado_em = now()
      WHERE id = $1
        AND usuario_id = $2
      RETURNING id, status
    `,
    [enrollmentId, userId]
  );
  const updated = result.rows[0];

  return {
    id: updated.id as string,
    turma: enrollment.turma as string,
    status: updated.status as string
  };
}
