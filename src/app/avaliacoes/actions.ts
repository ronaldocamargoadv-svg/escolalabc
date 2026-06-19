"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireAnyPermission } from "@/lib/auth";
import { maybeAutoIssueCertificate } from "@/lib/certification-automation";
import {
  createQuiz,
  EvaluationAccessError,
  submitCourseFeedback,
  submitInstructorAssessment,
  submitQuizAnswer,
  updateCertificationRequirements
} from "@/lib/evaluations";

const booleanFromForm = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.null()])
  .optional()
  .transform((value) => value === "on" || value === "true" || value === "1");

const requirementsSchema = z.object({
  turmaId: z.string().uuid(),
  exigirFrequencia: booleanFromForm,
  frequenciaMinima: z.coerce.number().min(0).max(100),
  exigirProgresso: booleanFromForm,
  progressoMinimo: z.coerce.number().min(0).max(100),
  exigirAvaliacaoCurso: booleanFromForm,
  exigirQuestionario: booleanFromForm,
  notaMinimaQuestionario: z.coerce.number().min(0).max(100),
  exigirAvaliacaoInstrutor: booleanFromForm,
  exigirAprovacaoInstrutor: booleanFromForm,
  liberarCertificadoAutomaticamente: booleanFromForm,
  exigirLiberacaoManualAdmin: booleanFromForm
});

const courseFeedbackSchema = z.object({
  turmaId: z.string().uuid(),
  overallRating: z.coerce.number().min(1).max(5),
  contentRelevance: z.coerce.number().min(1).max(5),
  methodology: z.coerce.number().min(1).max(5),
  workload: z.coerce.number().min(1).max(5),
  materials: z.coerce.number().min(1).max(5),
  instructorKnowledge: z.coerce.number().min(1).max(5),
  instructorClarity: z.coerce.number().min(1).max(5),
  instructorEngagement: z.coerce.number().min(1).max(5),
  practicalExamples: z.coerce.number().min(1).max(5),
  publicServiceApplicability: z.coerce.number().min(1).max(5),
  platformExperience: z.coerce.number().min(1).max(5),
  innovationContribution: z.coerce.number().min(1).max(5),
  npsScore: z.coerce.number().min(0).max(10),
  npsReason: z.string().trim().max(1000).optional(),
  mainLearning: z.string().trim().max(1000).optional(),
  improvementSuggestion: z.string().trim().max(1000).optional(),
  futureTopics: z.string().trim().max(1000).optional(),
  applicationIntent: z.string().trim().max(1000).optional()
});

const assessmentSchema = z.object({
  inscricaoId: z.string().uuid(),
  participationScore: z.coerce.number().min(1).max(5),
  attendanceScore: z.coerce.number().min(1).max(5),
  engagementScore: z.coerce.number().min(1).max(5),
  understandingScore: z.coerce.number().min(1).max(5),
  activitiesScore: z.coerce.number().min(1).max(5),
  debateContributionScore: z.coerce.number().min(1).max(5),
  practicalApplicationScore: z.coerce.number().min(1).max(5),
  collaborationScore: z.coerce.number().min(1).max(5),
  evolutionScore: z.coerce.number().min(1).max(5),
  certificationAptitudeScore: z.coerce.number().min(1).max(5),
  finalStatus: z.enum([
    "apto",
    "apto_com_ressalvas",
    "nao_apto",
    "pendente_atividade",
    "pendente_frequencia",
    "pendente_avaliacao_final"
  ]),
  publicFeedback: z.string().trim().max(1000).optional(),
  internalNotes: z.string().trim().max(1000).optional(),
  recommendation: z.string().trim().max(1000).optional()
});

const quizSchema = z.object({
  turmaId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(800).optional(),
  minimumScore: z.coerce.number().min(0).max(100),
  maxAttempts: z.coerce.number().int().min(1).max(10),
  requiredForCertificate: booleanFromForm,
  status: z.enum(["rascunho", "publicado"]),
  questionStatement: z.string().trim().min(6).max(1000),
  correctOption: z.string().trim().min(1).max(400),
  incorrectOption: z.string().trim().min(1).max(400)
});

const quizAnswerSchema = z.object({
  quizId: z.string().uuid(),
  selectedOptionId: z.string().uuid()
});

function actionError(error: unknown): never {
  if (error instanceof EvaluationAccessError) {
    throw new Error(error.message);
  }
  throw error;
}

function revalidateEvaluations() {
  revalidatePath("/avaliacoes");
  revalidatePath("/certificados");
  revalidatePath("/engajamento");
  revalidatePath("/minha-area");
}

export async function updateCertificationRequirementsAction(formData: FormData) {
  const user = await requireAnyPermission([
    "evaluations.configure_certification",
    "evaluations.manage_all"
  ]);
  const parsed = requirementsSchema.safeParse({
    turmaId: formData.get("turmaId"),
    exigirFrequencia: formData.get("exigirFrequencia"),
    frequenciaMinima: formData.get("frequenciaMinima") || 0,
    exigirProgresso: formData.get("exigirProgresso"),
    progressoMinimo: formData.get("progressoMinimo") || 0,
    exigirAvaliacaoCurso: formData.get("exigirAvaliacaoCurso"),
    exigirQuestionario: formData.get("exigirQuestionario"),
    notaMinimaQuestionario: formData.get("notaMinimaQuestionario") || 0,
    exigirAvaliacaoInstrutor: formData.get("exigirAvaliacaoInstrutor"),
    exigirAprovacaoInstrutor: formData.get("exigirAprovacaoInstrutor"),
    liberarCertificadoAutomaticamente: formData.get("liberarCertificadoAutomaticamente"),
    exigirLiberacaoManualAdmin: formData.get("exigirLiberacaoManualAdmin")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para configurar certificação.");
  }

  try {
    await updateCertificationRequirements(parsed.data, user);
  } catch (error) {
    actionError(error);
  }

  await writeAuditLog({
    action: "avaliacao.requisitos_certificacao_alterados",
    entity: "requisitos_certificacao",
    entityId: parsed.data.turmaId,
    summary: "Requisitos de certificação da turma atualizados."
  });
  revalidateEvaluations();
}

export async function submitCourseFeedbackAction(formData: FormData) {
  const user = await requireAnyPermission(["evaluations.respond_course_feedback"]);
  const parsed = courseFeedbackSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    throw new Error("Dados inválidos para responder avaliação da turma.");
  }

  let item;
  try {
    item = await submitCourseFeedback(parsed.data, user);
  } catch (error) {
    actionError(error);
  }

  await writeAuditLog({
    action: "avaliacao.turma_respondida",
    entity: "avaliacoes_turma_aluno",
    entityId: item.id,
    summary: "Avaliação da turma respondida pelo aluno."
  });
  await maybeAutoIssueCertificate(item.inscricaoId);
  revalidateEvaluations();
}

export async function submitInstructorAssessmentAction(formData: FormData) {
  const user = await requireAnyPermission([
    "student_assessments.create_own_class",
    "student_assessments.edit_own_class",
    "student_assessments.view_all"
  ]);
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    throw new Error("Dados inválidos para avaliação do aluno.");
  }

  let item;
  try {
    item = await submitInstructorAssessment(parsed.data, user);
  } catch (error) {
    actionError(error);
  }

  await writeAuditLog({
    action: "avaliacao.aluno_instrutor_salva",
    entity: "avaliacoes_aluno_instrutor",
    entityId: item.id,
    summary: "Avaliação individual do aluno registrada pelo Instrutor."
  });
  await maybeAutoIssueCertificate(parsed.data.inscricaoId);
  revalidateEvaluations();
}

export async function createQuizAction(formData: FormData) {
  const user = await requireAnyPermission([
    "quizzes.manage_all",
    "quizzes.create_own_class"
  ]);
  const parsed = quizSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar questionário.");
  }

  let item;
  try {
    item = await createQuiz(parsed.data, user);
  } catch (error) {
    actionError(error);
  }

  await writeAuditLog({
    action: parsed.data.status === "publicado" ? "questionario.publicado" : "questionario.criado",
    entity: "questionarios",
    entityId: item.id,
    summary: `Questionário ${parsed.data.title} criado.`
  });
  revalidateEvaluations();
}

export async function submitQuizAnswerAction(formData: FormData) {
  const user = await requireAnyPermission(["quizzes.respond"]);
  const parsed = quizAnswerSchema.safeParse({
    quizId: formData.get("quizId"),
    selectedOptionId: formData.get("selectedOptionId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para responder questionário.");
  }

  let item;
  try {
    item = await submitQuizAnswer(parsed.data, user);
  } catch (error) {
    actionError(error);
  }

  await writeAuditLog({
    action: "questionario.respondido",
    entity: "tentativas_questionario",
    entityId: item.id,
    summary: `Questionário respondido com resultado ${item.status}.`
  });
  revalidateEvaluations();
}
