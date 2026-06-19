import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import {
  getEngagementDetail,
  ProgressAccessError,
  statusLabel
} from "@/lib/progress";
import { uiLabel } from "@/lib/ui-labels";

function formatPercent(value: string | number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(0)}%` : "0%";
}

type PageProps = {
  params: Promise<{
    inscricaoId: string;
  }>;
};

export default async function EngagementDetailPage({ params }: PageProps) {
  const user = await requireAnyPermission([
    "progress.view_all",
    "progress.view_courses_managed",
    "progress.view_own"
  ]);
  const { inscricaoId } = await params;
  let detail;

  try {
    detail = await getEngagementDetail(user, inscricaoId);
  } catch (error) {
    if (error instanceof ProgressAccessError) {
      notFound();
    }

    throw error;
  }

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Detalhe de acompanhamento</p>
          <h1 className="page-title">{detail.summary.aluno}</h1>
          <p className="page-copy">
            {detail.summary.curso} - {detail.summary.turma}. Acompanhe aulas,
            eventos, último acesso e pendências para certificação.
          </p>
          <div className="hero-actions">
            <a className="button secondary" href="/engajamento">
              Voltar ao acompanhamento
            </a>
          </div>
        </div>
      </section>

      <section className="course-facts" aria-label="Resumo do aluno no curso">
        <article>
          <span>Status</span>
          <strong>{statusLabel(detail.summary.status)}</strong>
        </article>
        <article>
          <span>Progresso</span>
          <strong>{formatPercent(detail.summary.progresso)}</strong>
        </article>
        <article>
          <span>Último acesso</span>
          <strong>{detail.summary.ultimoAcesso ?? "Sem acesso"}</strong>
        </article>
        <article>
          <span>Fórum</span>
          <strong>{detail.forumPosts} participações</strong>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Dados do aluno e da inscrição</h2>
          <dl className="definition-grid">
            <div>
              <dt>E-mail</dt>
              <dd>{detail.summary.email}</dd>
            </div>
            <div>
              <dt>Órgão/Secretaria</dt>
              <dd>{detail.summary.orgaoSecretaria ?? "Não informado"}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{detail.summary.cargo ?? "Não informado"}</dd>
            </div>
            <div>
              <dt>Status da inscrição</dt>
              <dd>{uiLabel(detail.summary.statusInscricao)}</dd>
            </div>
            <div>
              <dt>Certificado</dt>
              <dd>{uiLabel(detail.summary.certificado)}</dd>
            </div>
            <div>
              <dt>Primeiro acesso</dt>
              <dd>{detail.summary.primeiroAcesso ?? "Sem acesso"}</dd>
            </div>
          </dl>
        </div>

        <aside className="panel">
          <h2>Pendências para certificação</h2>
          <ul className="checklist">
            {detail.pendenciasCertificacao.map((item, index) => (
              <li key={item}>
                <span className="check">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="panel">
        <h2>Aulas e acessos</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Aula</th>
              <th>Acessada</th>
              <th>Acessos</th>
              <th>Primeiro acesso</th>
              <th>Último acesso</th>
              <th>Conclusão</th>
            </tr>
          </thead>
          <tbody>
            {detail.aulas.map((aula) => (
              <tr key={aula.id}>
                <td>{aula.titulo}</td>
                <td>{aula.acessada ? "Sim" : "Não"}</td>
                <td>{aula.quantidadeAcessos}</td>
                <td>{aula.primeiroAcesso ?? "-"}</td>
                <td>{aula.ultimoAcesso ?? "-"}</td>
                <td>{aula.concluida ? aula.concluidoEm ?? "Sim" : "Pendente"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Linha do tempo de eventos</h2>
        <div className="stack-list">
          {detail.eventos.length ? (
            detail.eventos.map((event) => (
              <article className="list-card" key={event.id}>
                <div className="card-heading-row">
                  <strong>{uiLabel(event.tipo)}</strong>
                  <span className="badge">{event.criadoEm}</span>
                </div>
                <span>{event.aula ?? "Evento do curso"}</span>
              </article>
            ))
          ) : (
            <p className="muted-small">Nenhum evento registrado.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
