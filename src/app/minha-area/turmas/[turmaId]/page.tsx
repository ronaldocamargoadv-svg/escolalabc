import { notFound } from "next/navigation";
import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { getMyClassStartDetails } from "@/lib/my-area";
import { recordCourseOpened, statusLabel } from "@/lib/progress";
import { uiLabel } from "@/lib/ui-labels";
import {
  completeLessonAction,
  openLessonAction,
  recordMaterialAccessAction
} from "./actions";

function formatPercent(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(0)}%` : "0%";
}

type PageProps = {
  params: Promise<{
    turmaId: string;
  }>;
};

export default async function StartClassPage({ params }: PageProps) {
  const user = await requireCurrentUser();
  const { turmaId } = await params;
  const item = await getMyClassStartDetails(user.id, turmaId);

  if (!item) {
    notFound();
  }

  await recordCourseOpened(user.id, item.turmaId);

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface course-hero">
        <div>
          <p className="eyebrow">{item.tema ?? "Curso em andamento"}</p>
          <h1 className="page-title">{item.curso}</h1>
          <p className="page-copy">
            {item.descricao ??
              "Ambiente da turma com dados essenciais, informes, encontros, materiais e canais de participação."}
          </p>
          <div className="hero-actions">
            <a className="button" href={`/forum?turmaId=${item.turmaId}`}>
              Abrir debate da turma
            </a>
            <a className="button secondary" href="/minha-area">
              Voltar para minha jornada
            </a>
          </div>
        </div>
        <UserPill user={user} />
      </section>

      <section className="course-facts" aria-label="Resumo da turma">
        <article>
          <span>Turma</span>
          <strong>{item.turma}</strong>
        </article>
        <article>
          <span>Modalidade</span>
          <strong>{uiLabel(item.modalidade)}</strong>
        </article>
        <article>
          <span>Início</span>
          <strong>{item.dataInicio}</strong>
        </article>
        <article>
          <span>Progresso</span>
          <strong>{formatPercent(item.progressoAprendizagem)}</strong>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Dados e informes da turma</h2>
          <dl className="definition-grid">
            <div>
              <dt>Status da inscrição</dt>
              <dd>{uiLabel(item.statusInscricao)}</dd>
            </div>
            <div>
              <dt>Status da turma</dt>
              <dd>{uiLabel(item.statusTurma)}</dd>
            </div>
            <div>
              <dt>Carga horária</dt>
              <dd>{item.cargaHoraria}h</dd>
            </div>
            <div>
              <dt>Frequência mínima</dt>
              <dd>{formatPercent(item.criterioFrequenciaMinima)}</dd>
            </div>
            <div>
              <dt>Instrutor</dt>
              <dd>{item.instrutor ?? "A definir"}</dd>
              {item.instrutorLattesUrl ? (
                <a
                  className="text-button"
                  href={item.instrutorLattesUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Currículo Lattes
                </a>
              ) : null}
            </div>
            <div>
              <dt>Ambiente</dt>
              <dd>{item.local ?? item.linkOnline ?? "Ambiente LaBC"}</dd>
            </div>
            <div>
              <dt>Situação de aprendizagem</dt>
              <dd>{statusLabel(item.statusAprendizagem)}</dd>
            </div>
            <div>
              <dt>Último acesso</dt>
              <dd>{item.ultimoAcesso ?? "Primeiro acesso registrado agora"}</dd>
            </div>
          </dl>

          <h3 style={{ marginTop: 22 }}>Objetivos</h3>
          <p className="page-copy">
            {item.objetivos ?? "Objetivos detalhados serão publicados pela equipe."}
          </p>

          <h3 style={{ marginTop: 22 }}>Ementa</h3>
          <p className="page-copy">
            {item.ementa ?? "Ementa em organização pela equipe da Escola LaBC de Inovação."}
          </p>

          <h3 style={{ marginTop: 22 }}>Público-alvo</h3>
          <p className="page-copy">
            {item.publicoAlvo ?? "Alunos inscritos nesta turma."}
          </p>

          <div className="progress-row" style={{ marginTop: 22 }}>
            <span>Progresso do curso</span>
            <span>
              {item.aulasConcluidas} de {item.totalAulas} aulas concluídas
            </span>
          </div>
          <div className="progress-track">
            <span
              style={{
                width: `${Math.min(Number(item.progressoAprendizagem), 100)}%`
              }}
            />
          </div>
        </div>

        <aside className="panel">
          <h2>Aulas e encontros</h2>
          <ul className="checklist">
            {item.encontros.length ? (
              item.encontros.map((meeting) => (
                <li key={meeting.id}>
                  <span className="check">
                    {meeting.presenca ? "OK" : meeting.modalidade.slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <strong>{meeting.data}</strong>
                    <br />
                    {meeting.horarioInicio} às {meeting.horarioFim} - {uiLabel(meeting.status)}
                    <br />
                    <span className="muted-small">
                      {meeting.local ?? meeting.linkOnline ?? "Ambiente LaBC"}
                    </span>
                    <br />
                    <span className="muted-small">
                      Presença: {meeting.presenca ? uiLabel(meeting.presenca) : "não registrada"}
                    </span>
                    <br />
                    <span className="muted-small">
                      Acessos: {meeting.acessos} -{" "}
                      {meeting.concluida ? "concluída" : "pendente"}
                    </span>
                    <div className="action-row compact" style={{ marginTop: 10 }}>
                      <form action={openLessonAction}>
                        <input name="turmaId" type="hidden" value={item.turmaId} />
                        <input name="aulaId" type="hidden" value={meeting.id} />
                        <button className="text-button" type="submit">
                          Abrir aula
                        </button>
                      </form>
                      {!meeting.concluida ? (
                        <form action={completeLessonAction}>
                          <input name="turmaId" type="hidden" value={item.turmaId} />
                          <input name="aulaId" type="hidden" value={meeting.id} />
                          <button className="text-button" type="submit">
                            Marcar concluída
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </span>
                </li>
              ))
            ) : (
              <li>
                <span className="check">--</span>
                <span>Encontros serão publicados pela equipe.</span>
              </li>
            )}
          </ul>
        </aside>
      </section>

      <section className="content-grid lower-grid">
        <div className="panel">
          <h2>Materiais de apoio das aulas</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Escopo</th>
                <th>Tipo</th>
                <th>Publicação</th>
                <th>Acesso</th>
              </tr>
            </thead>
            <tbody>
              {item.materiais.length ? (
                item.materiais.map((material) => (
                  <tr key={material.id}>
                    <td>{material.titulo}</td>
                    <td>{material.aula ?? material.turma ?? material.curso ?? "Aula"}</td>
                    <td>{uiLabel(material.tipo)}</td>
                    <td>{material.publicadoEm}</td>
                    <td>
                      {material.url ? (
                        <div className="inline-actions">
                          <form action={recordMaterialAccessAction}>
                            <input name="turmaId" type="hidden" value={item.turmaId} />
                            <input name="materialId" type="hidden" value={material.id} />
                            <button className="button secondary" type="submit">
                              Acessar material
                            </button>
                          </form>
                        </div>
                      ) : (
                        "Sem link"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>Nenhum material de apoio foi disponibilizado para esta turma.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="panel">
          <h2>Informes rápidos</h2>
          <ul className="checklist">
            <li>
              <span className="check">1</span>
              <span>Acompanhe materiais e encontros nesta tela antes de cada aula.</span>
            </li>
            <li>
              <span className="check">2</span>
              <span>Use o debate da turma para dúvidas, combinados e contribuições.</span>
            </li>
            <li>
              <span className="check">3</span>
              <span>
                O certificado fica disponível quando os critérios da turma forem cumpridos.
              </span>
            </li>
          </ul>
        </aside>
      </section>
    </AppShell>
  );
}
