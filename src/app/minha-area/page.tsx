import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import {
  getMyCertificates,
  getMyEnrollments,
  getMyMaterials,
  getMyMeetings
} from "@/lib/my-area";
import { statusLabel } from "@/lib/progress";
import { uiLabel } from "@/lib/ui-labels";
import { cancelMyEnrollmentAction } from "./actions";
import { recordMaterialAccessAction } from "./turmas/[turmaId]/actions";

function formatPercent(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(0)}%` : "0%";
}

export default async function MyAreaPage() {
  const user = await requireCurrentUser();
  const [enrollments, materials, certificates, meetings] = await Promise.all([
    getMyEnrollments(user.id),
    getMyMaterials(user.id),
    getMyCertificates(user.id),
    getMyMeetings(user.id)
  ]);

  const activeEnrollments = enrollments.filter(
    (item) => item.status !== "cancelado"
  );
  const currentEnrollment =
    activeEnrollments.find((item) => item.statusAprendizagem !== "completed") ??
    activeEnrollments[0];

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface learner-hero">
        <div>
          <p className="eyebrow">Sua jornada de aprendizagem no LaBC</p>
          <h1 className="page-title">Minha jornada na Escola LaBC de Inovação</h1>
          <p className="page-copy">
            Acompanhe inscrições, aulas, frequência, materiais, debates e
            certificados em uma experiência formativa orientada à inovação
            pública.
          </p>
        </div>
        <UserPill user={user} />
      </section>

      <section className="metric-grid" aria-label="Resumo do aluno">
        <article className="metric">
          <span>Inscrições ativas</span>
          <strong>{activeEnrollments.length}</strong>
        </article>
        <article className="metric">
          <span>Materiais liberados</span>
          <strong>{materials.length}</strong>
        </article>
        <article className="metric">
          <span>Certificados</span>
          <strong>{certificates.length}</strong>
        </article>
        <article className="metric">
          <span>Progresso médio</span>
          <strong>
            {activeEnrollments.length
              ? `${Math.round(
                  activeEnrollments.reduce(
                    (sum, item) => sum + Number(item.progressoAprendizagem),
                    0
                  ) / activeEnrollments.length
                )}%`
              : "0%"}
          </strong>
        </article>
      </section>

      <section className="persona-action-grid" aria-label="Ações de aprendizagem">
        <a
          className="persona-action-card primary"
          href={
            currentEnrollment
              ? `/minha-area/turmas/${currentEnrollment.turmaId}`
              : "/catalogo"
          }
        >
          <span className="action-icon" aria-hidden="true">
            IR
          </span>
          <strong>Continuar curso</strong>
          <p>
            Retome sua turma em andamento ou escolha uma nova experiência
            formativa.
          </p>
        </a>
        <a className="persona-action-card" href="/catalogo">
          <span className="action-icon" aria-hidden="true">
            CA
          </span>
          <strong>Catálogo de cursos</strong>
          <p>Encontre cursos, trilhas e turmas abertas para inscrição.</p>
        </a>
        <a className="persona-action-card" href="/minha-area#participacao">
          <span className="action-icon" aria-hidden="true">
            PR
          </span>
          <strong>Meu progresso</strong>
          <p>Veja aulas concluídas, frequência e pendências de certificação.</p>
        </a>
        <a className="persona-action-card" href="/certificados">
          <span className="action-icon" aria-hidden="true">
            CE
          </span>
          <strong>Meus certificados</strong>
          <p>Acesse certificados disponíveis e acompanhe pendências.</p>
        </a>
        <a className="persona-action-card" href="/forum">
          <span className="action-icon" aria-hidden="true">
            DB
          </span>
          <strong>Fórum</strong>
          <p>Participe dos debates das turmas em que você está inscrito.</p>
        </a>
        <a className="persona-action-card" href="/agenda">
          <span className="action-icon" aria-hidden="true">
            AG
          </span>
          <strong>Minha Agenda</strong>
          <p>Organize aulas, prazos e seus compromissos de aprendizagem.</p>
        </a>
      </section>

      <section className="journey-map" aria-label="Linha da jornada formativa">
        <article className="journey-step active">
          <span>1</span>
          <strong>Inscrição</strong>
          <p>Escolha uma oferta e confirme sua participação.</p>
        </article>
        <article className="journey-step active">
          <span>2</span>
          <strong>Aprendizagem</strong>
          <p>Acesse encontros, materiais e debates da turma.</p>
        </article>
        <article className="journey-step">
          <span>3</span>
          <strong>Participação</strong>
          <p>Acompanhe frequência e atividades vinculadas.</p>
        </article>
        <article className="journey-step">
          <span>4</span>
          <strong>Certificação</strong>
          <p>Valide sua conclusão e mantenha o histórico formativo.</p>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Cursos em andamento</h2>
              <p className="muted-small">
                Progresso, aulas acessadas e próximas ações da sua trilha.
              </p>
            </div>
          </div>
          <div className="stack-list">
            {enrollments.length ? (
              enrollments.map((item) => (
                <article className="list-card" key={item.id}>
                  <div className="card-heading-row">
                    <strong>{item.curso}</strong>
                    <span className="badge blue">{uiLabel(item.modalidade)}</span>
                  </div>
                  <span>
                      {item.turma} - {uiLabel(item.modalidade)} - início {item.dataInicio}
                  </span>
                  <div className="progress-row">
                    <span>Progresso {formatPercent(item.progressoAprendizagem)}</span>
                    <span>
                      {item.aulasConcluidas}/{item.totalAulas} aulas concluídas
                    </span>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${Math.min(Number(item.progressoAprendizagem), 100)}%`
                      }}
                    />
                  </div>
                  <p className="muted-small">
                    Situação: {statusLabel(item.statusAprendizagem)}. Último acesso:{" "}
                    {item.ultimoAcesso ?? "ainda não registrado"}.
                  </p>
                  <div className="action-row compact">
                    <span className="badge">{uiLabel(item.status)}</span>
                    {item.aptoCertificado ? (
                      <span className="badge blue">apto a certificado</span>
                    ) : (
                      <span className="badge warning">em andamento</span>
                    )}
                    {item.status !== "cancelado" ? (
                      <a
                        className="button highlight"
                        href={`/minha-area/turmas/${item.turmaId}`}
                      >
                        Iniciar curso
                      </a>
                    ) : null}
                    {item.status !== "cancelado" ? (
                      <a className="button secondary" href={`/forum?turmaId=${item.turmaId}`}>
                        Abrir fórum
                      </a>
                    ) : null}
                    {item.status !== "cancelado" && !item.aptoCertificado ? (
                      <form action={cancelMyEnrollmentAction}>
                        <input name="inscricaoId" type="hidden" value={item.id} />
                        <button className="text-button danger" type="submit">
                          Cancelar inscrição
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-small">Nenhuma inscrição encontrada.</p>
            )}
          </div>
        </div>

        <aside className="panel" id="participacao">
          <h2>Participação e frequência</h2>
          <p className="muted-small">
            Consulte seus encontros recentes e a situação de presença registrada.
          </p>
          <ul className="checklist">
            {meetings.length ? (
              meetings.map((item) => (
                <li key={item.id}>
                  <span className="check">{item.presenca ? "OK" : "--"}</span>
                  <span>
                    <strong>{item.data}</strong>
                    <br />
                    {item.turma} - {item.horarioInicio} às {item.horarioFim}
                    <br />
                    <span className="muted-small">
                      Presença: {item.presenca ? uiLabel(item.presenca) : "não registrada"}
                    </span>
                  </span>
                </li>
              ))
            ) : (
              <li>
                <span className="check">--</span>
                <span>Nenhum encontro encontrado.</span>
              </li>
            )}
          </ul>
        </aside>
      </section>

      <section className="content-grid lower-grid">
        <div className="panel">
          <h2>Materiais liberados</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Escopo</th>
                <th>Tipo</th>
                <th>Acesso</th>
              </tr>
            </thead>
            <tbody>
              {materials.length ? (
                materials.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.titulo}
                      <br />
                      <span className="muted-small">{item.publicadoEm}</span>
                    </td>
                    <td>{item.aula ?? item.turma ?? item.curso}</td>
                    <td>{uiLabel(item.tipo)}</td>
                    <td>
                      {item.url ? (
                        <form action={recordMaterialAccessAction}>
                          <input name="turmaId" type="hidden" value={item.turmaId} />
                          <input name="materialId" type="hidden" value={item.id} />
                          <button className="text-button" type="submit">
                            Acessar material
                          </button>
                        </form>
                      ) : (
                        "Sem link"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>Nenhum material liberado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="panel">
          <h2>Meus certificados</h2>
          <div className="stack-list">
            {certificates.length ? (
              certificates.map((item) => (
                <article className="list-card" key={item.id}>
                  <div>
                    <strong>{item.curso}</strong>
                    <span>{item.turma}</span>
                  </div>
                  <span className="muted-small">
                    Código {item.codigoValidacao} - {item.dataEmissao}
                  </span>
                  <div className="action-row compact">
                    <a className="button secondary" href={`/api/certificados/${item.id}/pdf`}>
                      PDF
                    </a>
                    <a
                      className="button secondary"
                      href={`/certificados/validar?codigo=${item.codigoValidacao}`}
                    >
                      Validar
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-small">Nenhum certificado emitido.</p>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
