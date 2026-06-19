import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import { listEngagement, statusLabel } from "@/lib/progress";
import { uiLabel } from "@/lib/ui-labels";

function formatPercent(value: string | number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(0)}%` : "0%";
}

type PageProps = {
  searchParams?: Promise<{
    cursoId?: string;
    turmaId?: string;
    aluno?: string;
    status?: string;
  }>;
};

export default async function EngagementPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission([
    "progress.view_all",
    "progress.view_courses_managed"
  ]);
  const filters = (await searchParams) ?? {};
  const { rows, metrics, options } = await listEngagement(user, filters);

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Acompanhamento pedagógico</p>
          <h1 className="page-title">Acompanhamento dos alunos</h1>
          <p className="page-copy">
            Monitore início de curso, aulas acessadas, progresso, último acesso
            e pendências de participação para apoiar certificação e gestão
            formativa.
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Indicadores de engajamento">
        <article className="metric">
          <span>Alunos acompanhados</span>
          <strong>{metrics.totalAlunos}</strong>
        </article>
        <article className="metric">
          <span>Não iniciaram</span>
          <strong>{metrics.naoIniciados}</strong>
        </article>
        <article className="metric">
          <span>Em andamento</span>
          <strong>{metrics.emAndamento}</strong>
        </article>
        <article className="metric">
          <span>Média de progresso</span>
          <strong>{metrics.mediaProgresso}%</strong>
        </article>
      </section>

      <section className="panel">
        <h2>Filtros</h2>
        <form className="filter-bar" action="/engajamento">
          <select
            aria-label="Filtrar por curso"
            name="cursoId"
            defaultValue={filters.cursoId ?? ""}
          >
            <option value="">Todos os cursos</option>
            {options.cursos.map((course) => (
              <option key={course.id} value={course.id}>
                {course.nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por turma"
            name="turmaId"
            defaultValue={filters.turmaId ?? ""}
          >
            <option value="">Todas as turmas</option>
            {options.turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por status"
            name="status"
            defaultValue={filters.status ?? "todos"}
          >
            <option value="todos">Todos os status</option>
            <option value="not_started">Não iniciado</option>
            <option value="started">Iniciado</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluído</option>
          </select>
          <input
            aria-label="Buscar aluno ou e-mail"
            name="aluno"
            placeholder="Buscar aluno ou e-mail"
            defaultValue={filters.aluno ?? ""}
          />
          <button className="button" type="submit">
            Filtrar
          </button>
          <a className="button secondary" href="/engajamento">
            Limpar
          </a>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Alunos e progresso</h2>
            <p className="muted-small">
              Alunos sem acesso nos últimos 7 dias: {metrics.semAcesso7Dias}
            </p>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Curso / turma</th>
              <th>Status</th>
              <th>Progresso</th>
              <th>Aulas</th>
              <th>Primeiro acesso</th>
              <th>Último acesso</th>
              <th>Certificado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((item) => (
                <tr key={item.inscricaoId}>
                  <td>
                    {item.aluno}
                    <br />
                    <span className="muted-small">{item.email}</span>
                  </td>
                  <td>
                    {item.curso}
                    <br />
                    <span className="muted-small">{item.turma}</span>
                  </td>
                  <td>
                    <span
                      className={
                        item.status === "completed"
                          ? "badge blue"
                          : item.status === "not_started"
                            ? "badge warning"
                            : "badge"
                      }
                    >
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <div className="progress-row">
                      <span>{formatPercent(item.progresso)}</span>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${Math.min(Number(item.progresso), 100)}%` }} />
                    </div>
                  </td>
                  <td>
                    {item.aulasAcessadas} acessadas
                    <br />
                    <span className="muted-small">
                      {item.aulasConcluidas}/{item.totalAulas} concluídas
                    </span>
                  </td>
                  <td>{item.primeiroAcesso ?? "Sem acesso"}</td>
                  <td>{item.ultimoAcesso ?? "Sem acesso"}</td>
                  <td>{uiLabel(item.certificado)}</td>
                  <td>
                    <a className="table-link" href={`/engajamento/${item.inscricaoId}`}>
                      Ver detalhes
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  Nenhum acompanhamento encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
