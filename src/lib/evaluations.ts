import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  assertActiveInstructorAssignment,
  InstructorAssignmentError
} from "@/lib/instructor-assignments";
import { hasPermission } from "@/lib/permissions";

type RequirementRow = {
  id: string;
  turma_id: string;
  curso_id: string;
  exigir_frequencia: boolean;
  frequencia_minima: string | number;
  exigir_progresso: boolean;
  progresso_minimo: string | number;
  exigir_avaliacao_curso: boolean;
  exigir_questionario: boolean;
  nota_minima_questionario: string | number;
  exigir_avaliacao_instrutor: boolean;
  exigir_aprovacao_instrutor: boolean;
  emissao_automatica: boolean;
  liberacao_manual_admin: boolean;
};

export type RequirementStatus = {
  key: string;
  label: string;
  required: boolean;
  fulfilled: boolean;
  value: string;
  target: string;
};

export type CertificationEligibility = {
  inscricaoId: string;
  eligible: boolean;
  manualAdminRelease: boolean;
  autoIssueCertificate: boolean;
  certificateStatus: string;
  pendencias: string[];
  requirements: RequirementStatus[];
};

export type CertificationRequirementInput = {
  turmaId: string;
  exigirFrequencia: boolean;
  frequenciaMinima: number;
  exigirProgresso: boolean;
  progressoMinimo: number;
  exigirAvaliacaoCurso: boolean;
  exigirQuestionario: boolean;
  notaMinimaQuestionario: number;
  exigirAvaliacaoInstrutor: boolean;
  exigirAprovacaoInstrutor: boolean;
  liberarCertificadoAutomaticamente: boolean;
  exigirLiberacaoManualAdmin: boolean;
};

export type CourseFeedbackInput = {
  turmaId: string;
  overallRating: number;
  contentRelevance: number;
  methodology: number;
  workload: number;
  materials: number;
  instructorKnowledge: number;
  instructorClarity: number;
  instructorEngagement: number;
  practicalExamples: number;
  publicServiceApplicability: number;
  platformExperience: number;
  innovationContribution: number;
  npsScore: number;
  npsReason?: string;
  mainLearning?: string;
  improvementSuggestion?: string;
  futureTopics?: string;
  applicationIntent?: string;
};

export type InstructorAssessmentInput = {
  inscricaoId: string;
  participationScore: number;
  attendanceScore: number;
  engagementScore: number;
  understandingScore: number;
  activitiesScore: number;
  debateContributionScore: number;
  practicalApplicationScore: number;
  collaborationScore: number;
  evolutionScore: number;
  certificationAptitudeScore: number;
  finalStatus:
    | "apto"
    | "apto_com_ressalvas"
    | "nao_apto"
    | "pendente_atividade"
    | "pendente_frequencia"
    | "pendente_avaliacao_final";
  publicFeedback?: string;
  internalNotes?: string;
  recommendation?: string;
};

export type QuizInput = {
  turmaId: string;
  title: string;
  description?: string;
  minimumScore: number;
  maxAttempts: number;
  requiredForCertificate: boolean;
  status: "rascunho" | "publicado";
  questionStatement: string;
  correctOption: string;
  incorrectOption: string;
};

export type QuizAnswerInput = {
  quizId: string;
  selectedOptionId: string;
};

export type EvaluationDashboard = {
  classes: {
    id: string;
    curso: string;
    turma: string;
    status: string;
    requisito?: RequirementRow;
  }[];
  enrollments: {
    inscricaoId: string;
    turmaId: string;
    aluno: string;
    email: string;
    curso: string;
    turma: string;
    status: string;
    progresso: string;
    frequencia: string;
    elegibilidade: CertificationEligibility;
  }[];
  feedbacks: {
    id: string;
    turmaId: string;
    aluno: string;
    curso: string;
    turma: string;
    media: string;
    nps: number;
    enviadoEm: string;
    aprendizado: string | null;
    melhoria: string | null;
  }[];
  assessments: {
    id: string;
    inscricaoId: string;
    aluno: string;
    curso: string;
    turma: string;
    instrutor: string;
    resultado: string;
    enviadoEm: string;
  }[];
  quizzes: {
    id: string;
    turmaId: string;
    curso: string;
    turma: string;
    titulo: string;
    status: string;
    notaMinima: string;
    obrigatorio: boolean;
    tentativas: number;
    options: { id: string; text: string }[];
  }[];
};

export class EvaluationAccessError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 403) {
    super(message);
    this.name = "EvaluationAccessError";
    this.code = code;
    this.status = status;
  }
}

function isManager(user: CurrentUser) {
  return (
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "evaluations.manage_all")
  );
}

function assertScore(value: number, field: string, min = 1, max = 5) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new EvaluationAccessError(
      "INVALID_SCORE",
      `${field} deve estar entre ${min} e ${max}.`,
      422
    );
  }
}

function textOrNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 2000) : null;
}

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

async function getClassCourse(turmaId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT t.id AS turma_id, t.nome AS turma, t.status, t.curso_id,
             t.criterio_frequencia_minima, c.nome AS curso
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE t.id = $1
      LIMIT 1
    `,
    [turmaId]
  );
  const item = result.rows[0] as
    | {
        turma_id: string;
        turma: string;
        status: string;
        curso_id: string;
        criterio_frequencia_minima: string | number;
        curso: string;
      }
    | undefined;

  if (!item) {
    throw new EvaluationAccessError("CLASS_NOT_FOUND", "Turma não encontrada.", 404);
  }

  return item;
}

async function assertInstructorCanAct(user: CurrentUser, turmaId: string) {
  if (isManager(user)) {
    return;
  }

  try {
    await assertActiveInstructorAssignment(user, turmaId);
  } catch (error) {
    if (error instanceof InstructorAssignmentError) {
      throw new EvaluationAccessError(error.code, error.message, error.status);
    }
    throw error;
  }
}

export async function ensureCertificationRequirements(turmaId: string) {
  const classInfo = await getClassCourse(turmaId);
  const db = getDb();
  const existing = await db.query(
    "SELECT * FROM requisitos_certificacao WHERE turma_id = $1 LIMIT 1",
    [turmaId]
  );

  if (existing.rows[0]) {
    return existing.rows[0] as RequirementRow;
  }

  const inserted = await db.query(
    `
      INSERT INTO requisitos_certificacao (
        id, turma_id, curso_id, exigir_frequencia, frequencia_minima,
        exigir_progresso, progresso_minimo, exigir_avaliacao_curso,
        exigir_questionario, nota_minima_questionario,
        exigir_avaliacao_instrutor, exigir_aprovacao_instrutor,
        emissao_automatica, liberacao_manual_admin
      )
      VALUES (
        gen_random_uuid(), $1, $2, true, $3,
        true, 100, false,
        false, 70,
        false, false,
        false, true
      )
      RETURNING *
    `,
    [
      turmaId,
      classInfo.curso_id,
      numberValue(classInfo.criterio_frequencia_minima) || 75
    ]
  );

  return inserted.rows[0] as RequirementRow;
}

export async function updateCertificationRequirements(
  input: CertificationRequirementInput,
  user: CurrentUser
) {
  if (
    !hasPermission(user, "evaluations.configure_certification") &&
    !isManager(user)
  ) {
    throw new EvaluationAccessError(
      "CERTIFICATION_CONFIG_DENIED",
      "Você não possui permissão para configurar requisitos de certificação."
    );
  }

  const classInfo = await getClassCourse(input.turmaId);
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO requisitos_certificacao (
        id, turma_id, curso_id, exigir_frequencia, frequencia_minima,
        exigir_progresso, progresso_minimo, exigir_avaliacao_curso,
        exigir_questionario, nota_minima_questionario,
        exigir_avaliacao_instrutor, exigir_aprovacao_instrutor,
        emissao_automatica, liberacao_manual_admin,
        criado_em, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9,
        $10, $11,
        $12, $13,
        now(), now()
      )
      ON CONFLICT (turma_id)
      DO UPDATE SET
        exigir_frequencia = EXCLUDED.exigir_frequencia,
        frequencia_minima = EXCLUDED.frequencia_minima,
        exigir_progresso = EXCLUDED.exigir_progresso,
        progresso_minimo = EXCLUDED.progresso_minimo,
        exigir_avaliacao_curso = EXCLUDED.exigir_avaliacao_curso,
        exigir_questionario = EXCLUDED.exigir_questionario,
        nota_minima_questionario = EXCLUDED.nota_minima_questionario,
        exigir_avaliacao_instrutor = EXCLUDED.exigir_avaliacao_instrutor,
        exigir_aprovacao_instrutor = EXCLUDED.exigir_aprovacao_instrutor,
        emissao_automatica = EXCLUDED.emissao_automatica,
        liberacao_manual_admin = EXCLUDED.liberacao_manual_admin,
        atualizado_em = now()
      RETURNING *
    `,
    [
      input.turmaId,
      classInfo.curso_id,
      input.exigirFrequencia,
      input.frequenciaMinima,
      input.exigirProgresso,
      input.progressoMinimo,
      input.exigirAvaliacaoCurso,
      input.exigirQuestionario,
      input.notaMinimaQuestionario,
      input.exigirAvaliacaoInstrutor,
      input.exigirAprovacaoInstrutor,
      input.liberarCertificadoAutomaticamente,
      input.exigirLiberacaoManualAdmin
    ]
  );

  await refreshClassCertificationEligibility(input.turmaId);

  return result.rows[0] as RequirementRow;
}

export async function evaluateCertificationEligibility(
  inscricaoId: string
): Promise<CertificationEligibility> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT
        i.id AS inscricao_id,
        i.usuario_id,
        i.status AS inscricao_status,
        i.percentual_frequencia,
        i.turma_id,
        t.curso_id,
        COALESCE(pc.percentual_progresso, 0) AS percentual_progresso,
        COALESCE(pc.status, 'not_started') AS progresso_status,
        cert.status AS certificado_status
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      LEFT JOIN progresso_cursos pc ON pc.inscricao_id = i.id
      LEFT JOIN certificados cert ON cert.inscricao_id = i.id AND cert.status = 'valido'
      WHERE i.id = $1
      LIMIT 1
    `,
    [inscricaoId]
  );
  const enrollment = result.rows[0] as
    | {
        inscricao_id: string;
        usuario_id: string;
        inscricao_status: string;
        percentual_frequencia: string | number;
        turma_id: string;
        curso_id: string;
        percentual_progresso: string | number;
        progresso_status: string;
        certificado_status: string | null;
      }
    | undefined;

  if (!enrollment) {
    throw new EvaluationAccessError(
      "ENROLLMENT_NOT_FOUND",
      "Inscrição não encontrada.",
      404
    );
  }

  const req = await ensureCertificationRequirements(enrollment.turma_id);
  const [feedbackResult, assessmentResult, quizResult] = await Promise.all([
    db.query(
      `
        SELECT id FROM avaliacoes_turma_aluno
        WHERE turma_id = $1 AND aluno_id = $2
        LIMIT 1
      `,
      [enrollment.turma_id, enrollment.usuario_id]
    ),
    db.query(
      `
        SELECT resultado_final
        FROM avaliacoes_aluno_instrutor
        WHERE inscricao_id = $1
        ORDER BY submetido_em DESC NULLS LAST, atualizado_em DESC
        LIMIT 1
      `,
      [inscricaoId]
    ),
    db.query(
      `
        SELECT
          q.id,
          q.nota_minima,
          q.obrigatorio_certificado,
          best.percentual,
          best.status
        FROM questionarios q
        LEFT JOIN LATERAL (
          SELECT percentual, status
          FROM tentativas_questionario tq
          WHERE tq.questionario_id = q.id
            AND tq.aluno_id = $2
            AND tq.status IN ('submetido', 'aprovado', 'reprovado')
          ORDER BY percentual DESC, submetido_em DESC NULLS LAST
          LIMIT 1
        ) best ON true
        WHERE q.turma_id = $1
          AND q.status IN ('publicado', 'encerrado')
          AND q.obrigatorio_certificado = true
        ORDER BY q.criado_em ASC
      `,
      [enrollment.turma_id, enrollment.usuario_id]
    )
  ]);

  const finalAssessmentStatus = assessmentResult.rows[0]?.resultado_final as
    | string
    | undefined;
  const quizRows = quizResult.rows as Array<{
    id: string;
    nota_minima: string | number;
    percentual: string | number | null;
    status: string | null;
  }>;
  const frequency = numberValue(enrollment.percentual_frequencia);
  const progress = numberValue(enrollment.percentual_progresso);
  const quizMinimum = numberValue(req.nota_minima_questionario);
  const quizFulfilled =
    !req.exigir_questionario ||
    (quizRows.length > 0 &&
      quizRows.every(
        (quiz) =>
          numberValue(quiz.percentual) >=
          Math.max(numberValue(quiz.nota_minima), quizMinimum)
      ));
  const instructorApproved =
    finalAssessmentStatus === "apto" ||
    finalAssessmentStatus === "apto_com_ressalvas";

  const requirements: RequirementStatus[] = [
    {
      key: "frequency",
      label: "Frequência mínima",
      required: req.exigir_frequencia,
      fulfilled: !req.exigir_frequencia || frequency >= numberValue(req.frequencia_minima),
      value: `${frequency.toFixed(0)}%`,
      target: `${numberValue(req.frequencia_minima).toFixed(0)}%`
    },
    {
      key: "progress",
      label: "Progresso nas aulas",
      required: req.exigir_progresso,
      fulfilled: !req.exigir_progresso || progress >= numberValue(req.progresso_minimo),
      value: `${progress.toFixed(0)}%`,
      target: `${numberValue(req.progresso_minimo).toFixed(0)}%`
    },
    {
      key: "course_feedback",
      label: "Avaliação da turma",
      required: req.exigir_avaliacao_curso,
      fulfilled: !req.exigir_avaliacao_curso || Boolean(feedbackResult.rows[0]),
      value: feedbackResult.rows[0] ? "Respondida" : "Pendente",
      target: "Respondida"
    },
    {
      key: "quiz",
      label: "Questionário de aprendizagem",
      required: req.exigir_questionario,
      fulfilled: quizFulfilled,
      value: quizRows.length
        ? `${Math.max(...quizRows.map((quiz) => numberValue(quiz.percentual))).toFixed(0)}%`
        : "Pendente",
      target: `${quizMinimum.toFixed(0)}%`
    },
    {
      key: "instructor_assessment",
      label: "Avaliação do Instrutor",
      required: req.exigir_avaliacao_instrutor,
      fulfilled: !req.exigir_avaliacao_instrutor || Boolean(finalAssessmentStatus),
      value: finalAssessmentStatus ? evaluationLabel(finalAssessmentStatus) : "Aguardando",
      target: "Registrada"
    },
    {
      key: "instructor_approval",
      label: "Aprovação do Instrutor",
      required: req.exigir_aprovacao_instrutor,
      fulfilled: !req.exigir_aprovacao_instrutor || instructorApproved,
      value: finalAssessmentStatus ? evaluationLabel(finalAssessmentStatus) : "Aguardando",
      target: "Apto"
    }
  ];

  const activeRequirements = requirements.filter((item) => item.required);
  const pendencias = activeRequirements
    .filter((item) => !item.fulfilled)
    .map((item) => item.label);
  const eligible =
    enrollment.inscricao_status !== "cancelado" &&
    activeRequirements.every((item) => item.fulfilled);

  return {
    inscricaoId,
    eligible,
    manualAdminRelease: req.liberacao_manual_admin,
    autoIssueCertificate: req.emissao_automatica,
    certificateStatus: enrollment.certificado_status ?? "pendente",
    pendencias,
    requirements
  };
}

export async function refreshEnrollmentCertificationEligibility(inscricaoId: string) {
  const eligibility = await evaluateCertificationEligibility(inscricaoId);
  const db = getDb();
  await db.query(
    `
      UPDATE inscricoes
      SET apto_certificado = $2,
          atualizado_em = now()
      WHERE id = $1
    `,
    [inscricaoId, eligibility.eligible]
  );
  return eligibility;
}

export async function refreshClassCertificationEligibility(turmaId: string) {
  const db = getDb();
  const result = await db.query(
    "SELECT id FROM inscricoes WHERE turma_id = $1 AND status <> 'cancelado'",
    [turmaId]
  );

  for (const row of result.rows as Array<{ id: string }>) {
    await refreshEnrollmentCertificationEligibility(row.id);
  }
}

export async function submitCourseFeedback(input: CourseFeedbackInput, user: CurrentUser) {
  if (!hasPermission(user, "evaluations.respond_course_feedback")) {
    throw new EvaluationAccessError(
      "COURSE_FEEDBACK_DENIED",
      "Você não possui permissão para responder esta avaliação."
    );
  }

  [
    ["Avaliação geral", input.overallRating],
    ["Relevância do conteúdo", input.contentRelevance],
    ["Metodologia", input.methodology],
    ["Carga horária", input.workload],
    ["Materiais de apoio", input.materials],
    ["Domínio do Instrutor", input.instructorKnowledge],
    ["Clareza do Instrutor", input.instructorClarity],
    ["Estímulo à participação", input.instructorEngagement],
    ["Exemplos práticos", input.practicalExamples],
    ["Aplicabilidade no serviço público", input.publicServiceApplicability],
    ["Experiência na plataforma", input.platformExperience],
    ["Contribuição para inovação pública", input.innovationContribution]
  ].forEach(([label, value]) => assertScore(Number(value), String(label)));
  assertScore(input.npsScore, "NPS", 0, 10);

  const db = getDb();
  const enrollment = await db.query(
    `
      SELECT i.id, t.curso_id
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      WHERE i.usuario_id = $1
        AND i.turma_id = $2
        AND i.status <> 'cancelado'
      LIMIT 1
    `,
    [user.id, input.turmaId]
  );
  const item = enrollment.rows[0] as
    | { id: string; curso_id: string }
    | undefined;

  if (!item) {
    throw new EvaluationAccessError(
      "ENROLLMENT_REQUIRED",
      "Você só pode avaliar turmas em que está inscrito.",
      403
    );
  }

  const existing = await db.query(
    `
      SELECT id FROM avaliacoes_turma_aluno
      WHERE turma_id = $1 AND aluno_id = $2
      LIMIT 1
    `,
    [input.turmaId, user.id]
  );
  if (existing.rows[0]) {
    throw new EvaluationAccessError(
      "COURSE_FEEDBACK_ALREADY_SUBMITTED",
      "Você já respondeu a avaliação desta turma.",
      409
    );
  }

  const result = await db.query(
    `
      INSERT INTO avaliacoes_turma_aluno (
        id, curso_id, turma_id, aluno_id, expectativas, relevancia_conteudo,
        metodologia, carga_horaria, materiais, dominio_instrutor,
        clareza_instrutor, participacao_instrutor, exemplos_praticos,
        aplicabilidade_servico_publico, experiencia_plataforma,
        contribuicao_inovacao, nps_nota, nps_motivo, principal_aprendizado,
        sugestao_melhoria, temas_futuros, intencao_aplicacao,
        submetido_em, criado_em, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        now(), now(), now()
      )
      RETURNING id
    `,
    [
      item.curso_id,
      input.turmaId,
      user.id,
      input.overallRating,
      input.contentRelevance,
      input.methodology,
      input.workload,
      input.materials,
      input.instructorKnowledge,
      input.instructorClarity,
      input.instructorEngagement,
      input.practicalExamples,
      input.publicServiceApplicability,
      input.platformExperience,
      input.innovationContribution,
      input.npsScore,
      textOrNull(input.npsReason),
      textOrNull(input.mainLearning),
      textOrNull(input.improvementSuggestion),
      textOrNull(input.futureTopics),
      textOrNull(input.applicationIntent)
    ]
  );

  await refreshEnrollmentCertificationEligibility(item.id);

  return { id: result.rows[0].id as string, inscricaoId: item.id };
}

export async function submitInstructorAssessment(
  input: InstructorAssessmentInput,
  user: CurrentUser
) {
  const db = getDb();
  const enrollment = await db.query(
    `
      SELECT i.id, i.usuario_id, i.turma_id, t.curso_id, t.status AS turma_status
      FROM inscricoes i
      INNER JOIN turmas t ON t.id = i.turma_id
      WHERE i.id = $1 AND i.status <> 'cancelado'
      LIMIT 1
    `,
    [input.inscricaoId]
  );
  const item = enrollment.rows[0] as
    | {
        id: string;
        usuario_id: string;
        turma_id: string;
        curso_id: string;
        turma_status: string;
      }
    | undefined;

  if (!item) {
    throw new EvaluationAccessError(
      "ENROLLMENT_NOT_FOUND",
      "Inscrição não encontrada.",
      404
    );
  }

  if (!isManager(user)) {
    if (
      !hasPermission(user, "student_assessments.create_own_class") &&
      !hasPermission(user, "student_assessments.edit_own_class")
    ) {
      throw new EvaluationAccessError(
        "STUDENT_ASSESSMENT_DENIED",
        "Você não possui permissão para avaliar alunos."
      );
    }
    await assertInstructorCanAct(user, item.turma_id);
  }

  if (!isManager(user) && item.turma_status !== "publicada") {
    throw new EvaluationAccessError(
      "CLASS_CLOSED",
      "Turma encerrada ou indisponível não permite alterar avaliação pelo Instrutor.",
      409
    );
  }

  [
    ["Participação", input.participationScore],
    ["Assiduidade", input.attendanceScore],
    ["Interesse", input.engagementScore],
    ["Compreensão", input.understandingScore],
    ["Atividades", input.activitiesScore],
    ["Contribuições em debates", input.debateContributionScore],
    ["Aplicação prática", input.practicalApplicationScore],
    ["Colaboração", input.collaborationScore],
    ["Evolução", input.evolutionScore],
    ["Aptidão para certificação", input.certificationAptitudeScore]
  ].forEach(([label, value]) => assertScore(Number(value), String(label)));

  const result = await db.query(
    `
      INSERT INTO avaliacoes_aluno_instrutor (
        id, curso_id, turma_id, inscricao_id, aluno_id, instrutor_id,
        participacao, assiduidade, interesse,
        compreensao, atividades, debates,
        aplicacao_pratica, colaboracao, evolucao,
        aptidao_certificacao, resultado_final, feedback_publico,
        observacoes_internas, recomendacao, submetido_em, criado_em, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, now(), now(), now()
      )
      ON CONFLICT (inscricao_id, instrutor_id)
      DO UPDATE SET
        participacao = EXCLUDED.participacao,
        assiduidade = EXCLUDED.assiduidade,
        interesse = EXCLUDED.interesse,
        compreensao = EXCLUDED.compreensao,
        atividades = EXCLUDED.atividades,
        debates = EXCLUDED.debates,
        aplicacao_pratica = EXCLUDED.aplicacao_pratica,
        colaboracao = EXCLUDED.colaboracao,
        evolucao = EXCLUDED.evolucao,
        aptidao_certificacao = EXCLUDED.aptidao_certificacao,
        resultado_final = EXCLUDED.resultado_final,
        feedback_publico = EXCLUDED.feedback_publico,
        observacoes_internas = EXCLUDED.observacoes_internas,
        recomendacao = EXCLUDED.recomendacao,
        submetido_em = now(),
        atualizado_em = now()
      RETURNING id
    `,
    [
      item.curso_id,
      item.turma_id,
      input.inscricaoId,
      item.usuario_id,
      user.id,
      input.participationScore,
      input.attendanceScore,
      input.engagementScore,
      input.understandingScore,
      input.activitiesScore,
      input.debateContributionScore,
      input.practicalApplicationScore,
      input.collaborationScore,
      input.evolutionScore,
      input.certificationAptitudeScore,
      input.finalStatus,
      textOrNull(input.publicFeedback),
      textOrNull(input.internalNotes),
      textOrNull(input.recommendation)
    ]
  );

  await refreshEnrollmentCertificationEligibility(input.inscricaoId);

  return result.rows[0] as { id: string };
}

export async function createQuiz(input: QuizInput, user: CurrentUser) {
  const classInfo = await getClassCourse(input.turmaId);
  if (!isManager(user)) {
    if (!hasPermission(user, "quizzes.create_own_class")) {
      throw new EvaluationAccessError(
        "QUIZ_CREATE_DENIED",
        "Você não possui permissão para criar questionários."
      );
    }
    await assertInstructorCanAct(user, input.turmaId);
  }
  if (!isManager(user) && classInfo.status !== "publicada") {
    throw new EvaluationAccessError(
      "CLASS_CLOSED",
      "Turma encerrada não permite criar questionário pelo Instrutor.",
      409
    );
  }
  if (!input.title.trim() || !input.questionStatement.trim()) {
    throw new EvaluationAccessError(
      "QUIZ_REQUIRED_FIELDS",
      "Informe título e enunciado do questionário.",
      422
    );
  }
  if (!input.correctOption.trim() || !input.incorrectOption.trim()) {
    throw new EvaluationAccessError(
      "QUIZ_OPTIONS_REQUIRED",
      "Informe uma alternativa correta e uma alternativa incorreta.",
      422
    );
  }

  const db = getDb();
  const quiz = await db.query(
    `
      INSERT INTO questionarios (
        id, curso_id, turma_id, titulo, descricao, status,
        max_tentativas, nota_minima, obrigatorio_certificado,
        exibir_gabarito, exibir_feedback, criado_por_usuario_id,
        criado_em, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5,
        $6, $7, $8,
        true, true, $9,
        now(), now()
      )
      RETURNING id
    `,
    [
      classInfo.curso_id,
      input.turmaId,
      input.title.trim(),
      textOrNull(input.description),
      input.status,
      Math.max(1, input.maxAttempts || 1),
      Math.max(0, Math.min(100, input.minimumScore)),
      input.requiredForCertificate,
      user.id
    ]
  );
  const quizId = quiz.rows[0].id as string;
  const question = await db.query(
    `
      INSERT INTO questoes_questionario (
        id, questionario_id, tipo, enunciado, ordem, pontos,
        feedback_correto, feedback_incorreto, obrigatoria
      )
      VALUES (
        gen_random_uuid(), $1, 'single_choice', $2, 1, 10,
        'Resposta correta.', 'Revise o conteúdo da aula e tente novamente.', true
      )
      RETURNING id
    `,
    [quizId, input.questionStatement.trim()]
  );
  const questionId = question.rows[0].id as string;
  await db.query(
    `
      INSERT INTO opcoes_questionario (
        id, questao_id, texto, correta, ordem
      )
      VALUES
        (gen_random_uuid(), $1, $2, true, 1),
        (gen_random_uuid(), $1, $3, false, 2)
    `,
    [questionId, input.correctOption.trim(), input.incorrectOption.trim()]
  );

  return { id: quizId };
}

export async function submitQuizAnswer(input: QuizAnswerInput, user: CurrentUser) {
  if (!hasPermission(user, "quizzes.respond")) {
    throw new EvaluationAccessError(
      "QUIZ_RESPONSE_DENIED",
      "Você não possui permissão para responder questionários."
    );
  }

  const db = getDb();
  const quiz = await db.query(
    `
      SELECT q.*, i.id AS inscricao_id
      FROM questionarios q
      INNER JOIN inscricoes i
        ON i.turma_id = q.turma_id
       AND i.usuario_id = $2
       AND i.status <> 'cancelado'
      WHERE q.id = $1
        AND q.status = 'publicado'
      LIMIT 1
    `,
    [input.quizId, user.id]
  );
  const quizItem = quiz.rows[0] as
    | {
        id: string;
        turma_id: string;
        inscricao_id: string;
        max_tentativas: number;
        nota_minima: string | number;
      }
    | undefined;

  if (!quizItem) {
    throw new EvaluationAccessError(
      "QUIZ_NOT_AVAILABLE",
      "Questionário não disponível para este usuário.",
      404
    );
  }

  const attempts = await db.query(
    `
      SELECT COUNT(*)::int AS total
      FROM tentativas_questionario
      WHERE questionario_id = $1
        AND aluno_id = $2
        AND status IN ('submetido', 'aprovado', 'reprovado')
    `,
    [input.quizId, user.id]
  );
  const attemptNumber = Number(attempts.rows[0]?.total ?? 0) + 1;

  if (attemptNumber > Number(quizItem.max_tentativas || 1)) {
    throw new EvaluationAccessError(
      "QUIZ_ATTEMPT_LIMIT",
      "Você atingiu o limite de tentativas deste questionário.",
      409
    );
  }

  const optionResult = await db.query(
    `
      SELECT o.id, o.correta, q.id AS questao_id, q.pontos
      FROM opcoes_questionario o
      INNER JOIN questoes_questionario q ON q.id = o.questao_id
      WHERE o.id = $1
        AND q.questionario_id = $2
      LIMIT 1
    `,
    [input.selectedOptionId, input.quizId]
  );
  const option = optionResult.rows[0] as
    | { id: string; correta: boolean; questao_id: string; pontos: string | number }
    | undefined;

  if (!option) {
    throw new EvaluationAccessError(
      "QUIZ_OPTION_INVALID",
      "Alternativa inválida para este questionário.",
      422
    );
  }

  const score = option.correta ? numberValue(option.pontos) : 0;
  const percentage = option.correta ? 100 : 0;
  const status =
    percentage >= numberValue(quizItem.nota_minima) ? "aprovado" : "reprovado";
  const attempt = await db.query(
    `
      INSERT INTO tentativas_questionario (
        id, questionario_id, aluno_id, numero_tentativa,
        iniciado_em, submetido_em, nota, percentual, status
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3,
        now(), now(), $4, $5, $6
      )
      RETURNING id
    `,
    [input.quizId, user.id, attemptNumber, score, percentage, status]
  );
  await db.query(
    `
      INSERT INTO respostas_questionario (
        id, tentativa_id, questao_id, opcoes_selecionadas, correta,
        pontos_obtidos, criado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3::uuid[], $4, $5
      )
    `,
    [
      attempt.rows[0].id,
      option.questao_id,
      [input.selectedOptionId],
      option.correta,
      score
    ]
  );

  await refreshEnrollmentCertificationEligibility(quizItem.inscricao_id);

  return {
    id: attempt.rows[0].id as string,
    inscricaoId: quizItem.inscricao_id,
    percentage,
    status
  };
}

export async function listEvaluationDashboard(
  user: CurrentUser
): Promise<EvaluationDashboard> {
  const db = getDb();
  const manager = isManager(user);
  const classScope = manager
    ? { where: "true", values: [] as string[] }
    : hasPermission(user, "evaluations.view_own_class") ||
        hasPermission(user, "quizzes.view_results_own_class")
      ? {
          where:
            "EXISTS (SELECT 1 FROM vinculos_instrutoria vi WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status IN ('ativo', 'agendado', 'concluido'))",
          values: [user.id]
        }
      : { where: "i.usuario_id = $1", values: [user.id] };

  const [classesResult, enrollmentsResult, feedbackResult, assessmentResult, quizResult] =
    await Promise.all([
      db.query(
        `
          SELECT
            t.id AS turma_id,
            t.curso_id,
            c.nome AS curso,
            t.nome AS turma,
            t.status,
            rc.id AS requisito_id,
            rc.exigir_frequencia,
            rc.frequencia_minima,
            rc.exigir_progresso,
            rc.progresso_minimo,
            rc.exigir_avaliacao_curso,
            rc.exigir_questionario,
            rc.nota_minima_questionario,
            rc.exigir_avaliacao_instrutor,
            rc.exigir_aprovacao_instrutor,
            rc.emissao_automatica,
            rc.liberacao_manual_admin
          FROM turmas t
          INNER JOIN cursos c ON c.id = t.curso_id
          LEFT JOIN requisitos_certificacao rc ON rc.turma_id = t.id
          WHERE ${
            manager
              ? "true"
              : "EXISTS (SELECT 1 FROM vinculos_instrutoria vi WHERE vi.turma_id = t.id AND vi.usuario_id = $1)"
          }
          ORDER BY t.data_inicio DESC NULLS LAST, c.nome ASC
        `,
        manager ? [] : [user.id]
      ),
      db.query(
        `
          SELECT
            i.id AS inscricao_id, i.turma_id, u.nome AS aluno, u.email,
            c.nome AS curso, t.nome AS turma, i.status,
            COALESCE(pc.percentual_progresso, 0) AS progresso,
            i.percentual_frequencia AS frequencia
          FROM inscricoes i
          INNER JOIN usuarios u ON u.id = i.usuario_id
          INNER JOIN turmas t ON t.id = i.turma_id
          INNER JOIN cursos c ON c.id = t.curso_id
          LEFT JOIN progresso_cursos pc ON pc.inscricao_id = i.id
          WHERE ${classScope.where}
          ORDER BY c.nome ASC, t.nome ASC, u.nome ASC
        `,
        classScope.values
      ),
      db.query(
        `
          SELECT
            a.id, a.turma_id, u.nome AS aluno, c.nome AS curso, t.nome AS turma,
            ROUND((
              a.expectativas + a.relevancia_conteudo + a.metodologia +
              a.carga_horaria + a.materiais + a.dominio_instrutor +
              a.clareza_instrutor + a.participacao_instrutor +
              a.exemplos_praticos + a.aplicabilidade_servico_publico +
              a.experiencia_plataforma + a.contribuicao_inovacao
            ) / 12.0, 2) AS media,
            a.nps_nota,
            to_char(a.submetido_em, 'DD/MM/YYYY HH24:MI') AS submetido_em,
            a.principal_aprendizado, a.sugestao_melhoria
          FROM avaliacoes_turma_aluno a
          INNER JOIN usuarios u ON u.id = a.aluno_id
          INNER JOIN turmas t ON t.id = a.turma_id
          INNER JOIN cursos c ON c.id = a.curso_id
          WHERE ${
            manager
              ? "true"
              : hasPermission(user, "evaluations.view_course_feedback_own_class")
                ? "EXISTS (SELECT 1 FROM vinculos_instrutoria vi WHERE vi.turma_id = t.id AND vi.usuario_id = $1)"
                : "a.aluno_id = $1"
          }
          ORDER BY a.submetido_em DESC
          LIMIT 50
        `,
        manager ? [] : [user.id]
      ),
      db.query(
        `
          SELECT
            a.id, a.inscricao_id, aluno.nome AS aluno, c.nome AS curso,
            t.nome AS turma, instrutor.nome AS instrutor, a.resultado_final,
            to_char(a.submetido_em, 'DD/MM/YYYY HH24:MI') AS submetido_em
          FROM avaliacoes_aluno_instrutor a
          INNER JOIN usuarios aluno ON aluno.id = a.aluno_id
          INNER JOIN usuarios instrutor ON instrutor.id = a.instrutor_id
          INNER JOIN turmas t ON t.id = a.turma_id
          INNER JOIN cursos c ON c.id = a.curso_id
          WHERE ${
            manager
              ? "true"
              : hasPermission(user, "student_assessments.create_own_class")
                ? "EXISTS (SELECT 1 FROM vinculos_instrutoria vi WHERE vi.turma_id = t.id AND vi.usuario_id = $1)"
                : "a.aluno_id = $1"
          }
          ORDER BY a.submetido_em DESC
          LIMIT 80
        `,
        manager ? [] : [user.id]
      ),
      db.query(
        `
          SELECT
            q.id, q.turma_id, c.nome AS curso, t.nome AS turma, q.titulo,
            q.status, q.nota_minima, q.obrigatorio_certificado,
            COUNT(tq.id)::int AS tentativas
          FROM questionarios q
          INNER JOIN turmas t ON t.id = q.turma_id
          INNER JOIN cursos c ON c.id = q.curso_id
          LEFT JOIN tentativas_questionario tq ON tq.questionario_id = q.id
          WHERE ${
            manager
              ? "true"
              : hasPermission(user, "quizzes.view_results_own_class")
                ? "EXISTS (SELECT 1 FROM vinculos_instrutoria vi WHERE vi.turma_id = t.id AND vi.usuario_id = $1)"
                : "EXISTS (SELECT 1 FROM inscricoes i WHERE i.turma_id = t.id AND i.usuario_id = $1 AND i.status <> 'cancelado') AND q.status = 'publicado'"
          }
          GROUP BY q.id, c.nome, t.nome
          ORDER BY q.criado_em DESC
          LIMIT 80
        `,
        manager ? [] : [user.id]
      )
    ]);

  const enrollments = [];
  for (const row of enrollmentsResult.rows) {
    enrollments.push({
      inscricaoId: row.inscricao_id,
      turmaId: row.turma_id,
      aluno: row.aluno,
      email: row.email,
      curso: row.curso,
      turma: row.turma,
      status: row.status,
      progresso: String(row.progresso),
      frequencia: String(row.frequencia),
      elegibilidade: await evaluateCertificationEligibility(row.inscricao_id)
    });
  }

  const quizIds = quizResult.rows.map((row) => row.id as string);
  const optionsByQuiz = new Map<string, { id: string; text: string }[]>();
  if (quizIds.length) {
    const options = await db.query(
      `
        SELECT qq.questionario_id, o.id, o.texto
        FROM opcoes_questionario o
        INNER JOIN questoes_questionario qq ON qq.id = o.questao_id
        WHERE qq.questionario_id = ANY($1::uuid[])
        ORDER BY qq.ordem ASC, o.ordem ASC
      `,
      [quizIds]
    );
    for (const option of options.rows as Array<{
      questionario_id: string;
      id: string;
      texto: string;
    }>) {
      const list = optionsByQuiz.get(option.questionario_id) ?? [];
      list.push({ id: option.id, text: option.texto });
      optionsByQuiz.set(option.questionario_id, list);
    }
  }

  return {
    classes: classesResult.rows.map((row) => ({
      id: row.turma_id,
      curso: row.curso,
      turma: row.turma,
      status: row.status,
      requisito: row.requisito_id
        ? ({
            id: row.requisito_id,
            turma_id: row.turma_id,
            curso_id: row.curso_id,
            exigir_frequencia: row.exigir_frequencia,
            frequencia_minima: row.frequencia_minima,
            exigir_progresso: row.exigir_progresso,
            progresso_minimo: row.progresso_minimo,
            exigir_avaliacao_curso: row.exigir_avaliacao_curso,
            exigir_questionario: row.exigir_questionario,
            nota_minima_questionario: row.nota_minima_questionario,
            exigir_avaliacao_instrutor: row.exigir_avaliacao_instrutor,
            exigir_aprovacao_instrutor: row.exigir_aprovacao_instrutor,
            emissao_automatica: row.emissao_automatica,
            liberacao_manual_admin: row.liberacao_manual_admin
          } as RequirementRow)
        : undefined
    })),
    enrollments,
    feedbacks: feedbackResult.rows.map((row) => ({
      id: row.id,
      turmaId: row.turma_id,
      aluno: manager ? row.aluno : "Resposta anonimizada",
      curso: row.curso,
      turma: row.turma,
      media: String(row.media),
      nps: Number(row.nps_nota),
      enviadoEm: row.submetido_em,
      aprendizado: row.principal_aprendizado,
      melhoria: row.sugestao_melhoria
    })),
    assessments: assessmentResult.rows.map((row) => ({
      id: row.id,
      inscricaoId: row.inscricao_id,
      aluno: row.aluno,
      curso: row.curso,
      turma: row.turma,
      instrutor: row.instrutor,
      resultado: evaluationLabel(row.resultado_final),
      enviadoEm: row.submetido_em
    })),
    quizzes: quizResult.rows.map((row) => ({
      id: row.id,
      turmaId: row.turma_id,
      curso: row.curso,
      turma: row.turma,
      titulo: row.titulo,
      status: row.status,
      notaMinima: String(row.nota_minima),
      obrigatorio: Boolean(row.obrigatorio_certificado),
      tentativas: Number(row.tentativas),
      options: optionsByQuiz.get(row.id) ?? []
    }))
  };
}

export function evaluationLabel(status: string) {
  const labels: Record<string, string> = {
    apto: "Apto à certificação",
    apto_com_ressalvas: "Apto com ressalvas",
    nao_apto: "Não apto",
    pendente_atividade: "Pendente de atividade",
    pendente_frequencia: "Pendente de frequência",
    pendente_avaliacao_final: "Pendente de avaliação final",
    publicado: "Publicado",
    rascunho: "Rascunho",
    encerrado: "Encerrado",
    aprovado: "Aprovado",
    reprovado: "Reprovado"
  };

  return labels[status] ?? status;
}
