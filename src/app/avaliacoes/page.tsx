import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import {
  evaluationLabel,
  listEvaluationDashboard,
  type EvaluationDashboard
} from "@/lib/evaluations";
import { hasPermission } from "@/lib/permissions";
import { uiLabel } from "@/lib/ui-labels";
import {
  createQuizAction,
  submitCourseFeedbackAction,
  submitInstructorAssessmentAction,
  submitQuizAnswerAction,
  updateCertificationRequirementsAction
} from "./actions";

const scoreFields = [
  ["overallRating", "O curso atendeu às minhas expectativas."],
  ["contentRelevance", "O conteúdo foi relevante para minha atuação."],
  ["methodology", "A metodologia favoreceu o aprendizado."],
  ["workload", "A carga horária foi adequada."],
  ["materials", "Os materiais de apoio foram úteis."],
  ["instructorKnowledge", "O Instrutor demonstrou domínio do tema."],
  ["instructorClarity", "O Instrutor explicou o conteúdo com clareza."],
  ["instructorEngagement", "O Instrutor estimulou a participação."],
  ["practicalExamples", "O curso apresentou exemplos práticos."],
  ["publicServiceApplicability", "O conteúdo pode ser aplicado no serviço público."],
  ["platformExperience", "A plataforma facilitou o acesso ao curso."],
  ["innovationContribution", "O curso contribuiu para minha visão sobre inovação pública."]
] as const;

const instructorScoreFields = [
  ["participationScore", "Participação nas aulas"],
  ["attendanceScore", "Assiduidade/frequência"],
  ["engagementScore", "Interesse demonstrado"],
  ["understandingScore", "Compreensão dos conceitos"],
  ["activitiesScore", "Realização das atividades"],
  ["debateContributionScore", "Contribuições em debates"],
  ["practicalApplicationScore", "Aplicação prática do conteúdo"],
  ["collaborationScore", "Colaboração com participantes"],
  ["evolutionScore", "Evolução durante a turma"],
  ["certificationAptitudeScore", "Aptidão geral para certificação"]
] as const;

function scoreSelect(name: string, label: string) {
  return (
    <div className="field" key={name}>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue="5">
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}

function RequirementBadge({ fulfilled }: { fulfilled: boolean }) {
  return (
    <span className={fulfilled ? "badge green" : "badge yellow"}>
      {fulfilled ? "Cumprido" : "Pendente"}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default async function EvaluationsPage() {
  const user = await requireAnyPermission([
    "evaluations.view_all",
    "evaluations.manage_all",
    "evaluations.view_own_class",
    "evaluations.respond_course_feedback",
    "quizzes.respond",
    "certification.view_own_requirements"
  ]);
  const dashboard = await listEvaluationDashboard(user);
  const canConfigure = hasPermission(user, "evaluations.configure_certification");
  const canCreateQuiz =
    hasPermission(user, "quizzes.manage_all") ||
    hasPermission(user, "quizzes.create_own_class");
  const canAssess =
    hasPermission(user, "student_assessments.view_all") ||
    hasPermission(user, "student_assessments.create_own_class");
  const isLearnerExperience =
    !hasPermission(user, "evaluations.view_all") &&
    !hasPermission(user, "evaluations.view_own_class");
  const canRespondFeedback =
    isLearnerExperience && hasPermission(user, "evaluations.respond_course_feedback");
  const canRespondQuiz = isLearnerExperience && hasPermission(user, "quizzes.respond");
  const pendingCount = dashboard.enrollments.filter(
    (item) => !item.elegibilidade.eligible
  ).length;
  const eligibleCount = dashboard.enrollments.filter(
    (item) => item.elegibilidade.eligible
  ).length;

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Qualidade, aprendizagem e conclusão</p>
          <h1 className="page-title">Avaliações e Certificação</h1>
          <p className="page-copy">
            Integre avaliação da turma, questionário de aprendizagem, avaliação do
            aluno pelo Instrutor e requisitos para emissão do certificado.
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Resumo de avaliações">
        <MetricCard label="Turmas acompanhadas" value={dashboard.classes.length} />
        <MetricCard label="Questionários" value={dashboard.quizzes.length} />
        <MetricCard label="Avaliações respondidas" value={dashboard.feedbacks.length} />
        <MetricCard label="Aptos à certificação" value={eligibleCount} />
        <MetricCard label="Com pendências" value={pendingCount} />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Pendências para certificado</h2>
              <p className="muted">
                A mesma regra consolida frequência, progresso, avaliações e
                questionários antes da emissão.
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Curso / Turma</th>
                  <th>Progresso</th>
                  <th>Frequência</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.enrollments.length ? (
                  dashboard.enrollments.map((item) => (
                    <tr key={item.inscricaoId}>
                      <td>
                        <strong>{item.aluno}</strong>
                        <span className="muted-small">{item.email}</span>
                      </td>
                      <td>
                        {item.curso}
                        <span className="muted-small">{item.turma}</span>
                      </td>
                      <td>{Number(item.progresso).toFixed(0)}%</td>
                      <td>{Number(item.frequencia).toFixed(0)}%</td>
                      <td>
                        <RequirementBadge fulfilled={item.elegibilidade.eligible} />
                        <span className="muted-small">
                          {item.elegibilidade.pendencias.length
                            ? item.elegibilidade.pendencias.join(", ")
                            : "Certificado disponível para liberação."}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      Nenhuma inscrição encontrada para os filtros do seu perfil.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {canConfigure ? <CertificationRulesPanel data={dashboard} /> : null}
      </section>

      <section className="content-grid">
        {canCreateQuiz ? <QuizCreatePanel data={dashboard} /> : null}
        {canAssess ? <InstructorAssessmentPanel data={dashboard} /> : null}
        {canRespondFeedback ? <CourseFeedbackPanel data={dashboard} /> : null}
        {canRespondQuiz ? <QuizRespondPanel data={dashboard} /> : null}
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Avaliação da turma pelos alunos</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Média</th>
                  <th>NPS</th>
                  <th>Contribuição</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.feedbacks.length ? (
                  dashboard.feedbacks.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.curso}
                        <span className="muted-small">{item.turma}</span>
                      </td>
                      <td>{item.media}</td>
                      <td>{item.nps}</td>
                      <td>
                        <span className="muted-small">
                          {item.aprendizado || item.melhoria || "Sem comentário aberto."}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>Nenhuma avaliação de turma respondida.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Questionários de aprendizagem</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Questionário</th>
                  <th>Situação</th>
                  <th>Nota mínima</th>
                  <th>Tentativas</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.quizzes.length ? (
                  dashboard.quizzes.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.titulo}</strong>
                        <span className="muted-small">
                          {item.curso} - {item.turma}
                        </span>
                      </td>
                      <td>
                        <span className="badge blue">{uiLabel(item.status)}</span>
                      </td>
                      <td>{Number(item.notaMinima).toFixed(0)}%</td>
                      <td>{item.tentativas}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>Nenhum questionário cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function CertificationRulesPanel({ data }: { data: EvaluationDashboard }) {
  const firstClass = data.classes[0];
  const req = firstClass?.requisito;

  return (
    <div className="panel">
      <h2>Requisitos de certificação</h2>
      {firstClass ? (
        <form className="form-grid compact" action={updateCertificationRequirementsAction}>
          <input name="turmaId" type="hidden" value={firstClass.id} />
          <div className="field">
            <label htmlFor="turma-requisito">Turma</label>
            <select id="turma-requisito" name="turmaId" defaultValue={firstClass.id}>
              {data.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.curso} - {item.turma}
                </option>
              ))}
            </select>
          </div>
          <div className="split">
            <label className="check-card">
              <input
                defaultChecked={req?.exigir_frequencia ?? true}
                name="exigirFrequencia"
                type="checkbox"
              />
              Exigir frequência
            </label>
            <div className="field">
              <label htmlFor="frequenciaMinima">Frequência mínima (%)</label>
              <input
                defaultValue={Number(req?.frequencia_minima ?? 75)}
                id="frequenciaMinima"
                max="100"
                min="0"
                name="frequenciaMinima"
                type="number"
              />
            </div>
          </div>
          <div className="split">
            <label className="check-card">
              <input
                defaultChecked={req?.exigir_progresso ?? true}
                name="exigirProgresso"
                type="checkbox"
              />
              Exigir progresso
            </label>
            <div className="field">
              <label htmlFor="progressoMinimo">Progresso mínimo (%)</label>
              <input
                defaultValue={Number(req?.progresso_minimo ?? 100)}
                id="progressoMinimo"
                max="100"
                min="0"
                name="progressoMinimo"
                type="number"
              />
            </div>
          </div>
          <label className="check-card">
            <input
              defaultChecked={req?.exigir_avaliacao_curso ?? false}
              name="exigirAvaliacaoCurso"
              type="checkbox"
            />
            Exigir avaliação da turma pelo aluno
          </label>
          <label className="check-card">
            <input
              defaultChecked={req?.exigir_questionario ?? false}
              name="exigirQuestionario"
              type="checkbox"
            />
            Exigir questionário objetivo
          </label>
          <div className="field">
            <label htmlFor="notaMinimaQuestionario">Nota mínima do questionário (%)</label>
            <input
              defaultValue={Number(req?.nota_minima_questionario ?? 70)}
              id="notaMinimaQuestionario"
              max="100"
              min="0"
              name="notaMinimaQuestionario"
              type="number"
            />
          </div>
          <label className="check-card">
            <input
              defaultChecked={req?.exigir_avaliacao_instrutor ?? false}
              name="exigirAvaliacaoInstrutor"
              type="checkbox"
            />
            Exigir avaliação do aluno pelo Instrutor
          </label>
          <label className="check-card">
            <input
              defaultChecked={req?.exigir_aprovacao_instrutor ?? false}
              name="exigirAprovacaoInstrutor"
              type="checkbox"
            />
            Exigir aprovação do Instrutor
          </label>
          <label className="check-card">
            <input
              defaultChecked={req?.emissao_automatica ?? false}
              name="liberarCertificadoAutomaticamente"
              type="checkbox"
            />
            Liberar certificado automaticamente ao cumprir requisitos
          </label>
          <label className="check-card">
            <input
              defaultChecked={req?.liberacao_manual_admin ?? true}
              name="exigirLiberacaoManualAdmin"
              type="checkbox"
            />
            Exigir liberação manual do Administrador
          </label>
          <button className="button" type="submit">
            Salvar requisitos
          </button>
        </form>
      ) : (
        <p className="muted">Nenhuma turma disponível para configuração.</p>
      )}
    </div>
  );
}

function QuizCreatePanel({ data }: { data: EvaluationDashboard }) {
  return (
    <div className="panel">
      <h2>Criar questionário</h2>
      {data.classes.length ? (
        <form className="form-grid compact" action={createQuizAction}>
          <div className="field">
            <label htmlFor="quiz-turma">Turma</label>
            <select id="quiz-turma" name="turmaId">
              {data.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.curso} - {item.turma}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="quiz-title">Título</label>
            <input id="quiz-title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="quiz-description">Descrição</label>
            <textarea id="quiz-description" name="description" />
          </div>
          <div className="split">
            <div className="field">
              <label htmlFor="minimumScore">Nota mínima (%)</label>
              <input defaultValue="70" id="minimumScore" name="minimumScore" type="number" />
            </div>
            <div className="field">
              <label htmlFor="maxAttempts">Tentativas</label>
              <input defaultValue="2" id="maxAttempts" name="maxAttempts" type="number" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="status">Situação</label>
            <select defaultValue="publicado" id="status" name="status">
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
            </select>
          </div>
          <label className="check-card">
            <input defaultChecked name="requiredForCertificate" type="checkbox" />
            Obrigatório para certificação
          </label>
          <div className="field">
            <label htmlFor="questionStatement">Enunciado</label>
            <textarea id="questionStatement" name="questionStatement" required />
          </div>
          <div className="split">
            <div className="field">
              <label htmlFor="correctOption">Alternativa correta</label>
              <input id="correctOption" name="correctOption" required />
            </div>
            <div className="field">
              <label htmlFor="incorrectOption">Alternativa incorreta</label>
              <input id="incorrectOption" name="incorrectOption" required />
            </div>
          </div>
          <button className="button" type="submit">
            Criar questionário
          </button>
        </form>
      ) : (
        <p className="muted">Nenhuma turma vinculada para criação de questionário.</p>
      )}
    </div>
  );
}

function InstructorAssessmentPanel({ data }: { data: EvaluationDashboard }) {
  const enrollment = data.enrollments[0];
  return (
    <div className="panel">
      <h2>Avaliar aluno</h2>
      {enrollment ? (
        <form className="form-grid compact" action={submitInstructorAssessmentAction}>
          <div className="field">
            <label htmlFor="inscricaoId">Aluno</label>
            <select id="inscricaoId" name="inscricaoId" defaultValue={enrollment.inscricaoId}>
              {data.enrollments.map((item) => (
                <option key={item.inscricaoId} value={item.inscricaoId}>
                  {item.aluno} - {item.turma}
                </option>
              ))}
            </select>
          </div>
          {instructorScoreFields.map(([name, label]) => scoreSelect(name, label))}
          <div className="field">
            <label htmlFor="finalStatus">Resultado final</label>
            <select id="finalStatus" name="finalStatus" defaultValue="apto">
              {[
                "apto",
                "apto_com_ressalvas",
                "nao_apto",
                "pendente_atividade",
                "pendente_frequencia",
                "pendente_avaliacao_final"
              ].map((status) => (
                <option key={status} value={status}>
                  {evaluationLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="publicFeedback">Observações pedagógicas ao aluno</label>
            <textarea id="publicFeedback" name="publicFeedback" />
          </div>
          <div className="field">
            <label htmlFor="internalNotes">Observações internas</label>
            <textarea id="internalNotes" name="internalNotes" />
          </div>
          <button className="button" type="submit">
            Salvar avaliação
          </button>
        </form>
      ) : (
        <p className="muted">Nenhum aluno disponível para avaliação neste perfil.</p>
      )}
    </div>
  );
}

function CourseFeedbackPanel({ data }: { data: EvaluationDashboard }) {
  const enrollment = data.enrollments[0];
  return (
    <div className="panel">
      <h2>Responder avaliação da turma</h2>
      {enrollment ? (
        <form className="form-grid compact" action={submitCourseFeedbackAction}>
          <input name="turmaId" type="hidden" value={enrollment.turmaId} />
          <p className="muted">
            Sua avaliação apoia a melhoria contínua da Escola LaBC de Inovação.
          </p>
          {scoreFields.map(([name, label]) => scoreSelect(name, label))}
          <div className="field">
            <label htmlFor="npsScore">
              Probabilidade de recomendar esta formação a outro servidor público
            </label>
            <select defaultValue="10" id="npsScore" name="npsScore">
              {Array.from({ length: 11 }, (_, index) => 10 - index).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mainLearning">Qual foi o principal aprendizado?</label>
            <textarea id="mainLearning" name="mainLearning" />
          </div>
          <div className="field">
            <label htmlFor="improvementSuggestion">O que poderia ser melhorado?</label>
            <textarea id="improvementSuggestion" name="improvementSuggestion" />
          </div>
          <div className="field">
            <label htmlFor="futureTopics">Temas sugeridos para próximas formações</label>
            <textarea id="futureTopics" name="futureTopics" />
          </div>
          <button className="button" type="submit">
            Enviar avaliação
          </button>
        </form>
      ) : (
        <p className="muted">Você ainda não possui turma disponível para avaliação.</p>
      )}
    </div>
  );
}

function QuizRespondPanel({ data }: { data: EvaluationDashboard }) {
  const quiz = data.quizzes.find((item) => item.status === "publicado" && item.options.length);
  return (
    <div className="panel">
      <h2>Responder questionário</h2>
      {quiz ? (
        <form className="form-grid compact" action={submitQuizAnswerAction}>
          <input name="quizId" type="hidden" value={quiz.id} />
          <p className="muted">
            {quiz.titulo} - nota mínima de {Number(quiz.notaMinima).toFixed(0)}%.
          </p>
          <div className="field">
            <label htmlFor="selectedOptionId">Selecione sua resposta</label>
            <select id="selectedOptionId" name="selectedOptionId">
              {quiz.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>
          <button className="button" type="submit">
            Enviar resposta
          </button>
        </form>
      ) : (
        <p className="muted">Nenhum questionário publicado está disponível para resposta.</p>
      )}
    </div>
  );
}
